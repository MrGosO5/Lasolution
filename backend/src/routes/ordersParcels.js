const { Prisma } = require("@prisma/client");
const { requireAuth, requireRoles } = require("../middleware/auth");
const { hashPassword, verifyPassword } = require("../auth/password");
const crypto = require("crypto");
const { saveOrderProof, saveTestimonialPhoto, deleteProofByPublicPath } = require("../utils/mediaProof");
const { sendMail, createSmtpTransporter, buildMailFrom } = require("../emails/mailer");
const { orderStatusEmail } = require("../emails/templates");

function isOrderDelivered(order) {
  if (!order) return false;
  if (String(order.status || "").toUpperCase() === "DELIVERED") return true;
  const parcels = order.parcels || [];
  if (parcels.length === 0) return false;
  return parcels.every((p) => String(p.status || "").toUpperCase() === "DELIVERED");
}

function formatNotifDate(d) {
  try {
    const dt = d instanceof Date ? d : new Date(d);
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(dt);
  } catch {
    return "";
  }
}

function orderStatusCopy(status) {
  const s = String(status || "").toUpperCase();
  const map = {
    AWAITING_PAYMENT: {
      title: "Commande en attente de paiement",
      body: "Finalisez le paiement pour lancer la préparation.",
    },
    PAID: {
      title: "Paiement enregistré",
      body: "Votre commande est prise en charge.",
    },
    DELIVERED: {
      title: "Commande livrée",
      body: "Merci de confirmer la réception si ce n’est pas déjà fait.",
    },
  };
  return map[s] || { title: "Mise à jour de commande", body: `Statut : ${status || "—"}.` };
}

function setupOrderParcelRoutes(app, getPrisma) {
  const adminOnly = [requireAuth, requireRoles("admin")];
  const clientOrAdmin = [requireAuth, requireRoles("admin", "client")];

  app.get("/me", requireAuth, async (req, res) => {
    const prisma = getPrisma();
    if (prisma) {
      try {
        const u = await prisma.user.findUnique({
          where: { id: req.auth.sub },
          select: { id: true, email: true, name: true, role: true, profile: true },
        });
        if (u) {
          return res.json(u);
        }
      } catch (e) {
        console.warn("[GET /me] prisma:", e.message);
      }
    }
    res.json({
      id: req.auth.sub,
      email: req.auth.email,
      role: req.auth.role,
      name: req.auth.name,
      profile: null,
    });
  });

  app.patch("/me", requireAuth, async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) {
      return res.status(503).json({ error: "Base indisponible." });
    }
    const userId = req.auth.sub;
    const { name, profile } = req.body || {};

    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { profile: true },
    });
    if (!existing) {
      return res.status(404).json({ error: "Utilisateur introuvable." });
    }

    const data = {};
    if (typeof name === "string") {
      const n = name.trim().slice(0, 200);
      if (n) data.name = n;
    }
    if (profile && typeof profile === "object" && !Array.isArray(profile)) {
      const prev =
        existing.profile && typeof existing.profile === "object" && !Array.isArray(existing.profile)
          ? existing.profile
          : {};
      data.profile = { ...prev, ...profile };
    }

    if (Object.keys(data).length === 0) {
      const u = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, role: true, profile: true },
      });
      return res.json(u);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, name: true, role: true, profile: true },
    });
    res.json(updated);
  });

  app.post("/me/password", requireAuth, async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) {
      return res.status(503).json({ error: "Base indisponible." });
    }
    const userId = req.auth.sub;
    const { currentPassword, newPassword } = req.body || {};
    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).json({ error: "Le nouveau mot de passe doit contenir au moins 8 caractères." });
    }
    const row = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!row) {
      return res.status(404).json({ error: "Utilisateur introuvable." });
    }
    if (!row.passwordHash) {
      return res.status(400).json({
        error:
          "Ce compte n’a pas de mot de passe géré en ligne (compte démo). Créez un compte via l’inscription pour définir un mot de passe.",
      });
    }
    if (!verifyPassword(String(currentPassword || ""), row.passwordHash)) {
      return res.status(401).json({ error: "Mot de passe actuel incorrect." });
    }
    let newHash;
    try {
      newHash = hashPassword(newPassword);
    } catch (e) {
      return res.status(500).json({ error: String(e.message || e) });
    }
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });
    try {
      await prisma.securityEvent.create({
        data: {
          type: "password_change",
          userId,
          ip: req.ip || null,
          userAgent: (req.get("user-agent") || "").slice(0, 512) || null,
        },
      });
    } catch (_) {
      /* ignore */
    }
    res.json({ ok: true });
  });

  /** Fil d’activité dérivé des commandes + événements de suivi colis (compte connecté). */
  app.get("/me/notifications", requireAuth, async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) {
      return res.status(503).json({ error: "Base indisponible." });
    }
    if (!["admin", "client"].includes(req.auth.role)) {
      return res.json({ items: [] });
    }

    const orders = await prisma.order.findMany({
      where: { userId: req.auth.sub },
      orderBy: { updatedAt: "desc" },
      take: 30,
      include: {
        parcels: {
          include: {
            trackingEvents: { orderBy: { createdAt: "desc" }, take: 12 },
          },
        },
      },
    });

    const items = [];
    for (const o of orders) {
      const short = o.id.slice(0, 8).toUpperCase();
      const copy = orderStatusCopy(o.status);
      items.push({
        id: `order-${o.id}`,
        kind: "order",
        title: copy.title,
        body: `${copy.body} — réf. ${short}`,
        at: o.updatedAt.toISOString(),
        atLabel: formatNotifDate(o.updatedAt),
        href: `/mes-commandes/${o.id}`,
      });
      for (const p of o.parcels) {
        for (const ev of p.trackingEvents) {
          const msg = ev.message || ev.status || "Mise à jour du suivi";
          items.push({
            id: `track-${ev.id}`,
            kind: "tracking",
            title: "Suivi colis",
            body: `${msg} — commande ${short}`,
            at: ev.createdAt.toISOString(),
            atLabel: formatNotifDate(ev.createdAt),
            href: `/mes-commandes/${o.id}`,
          });
        }
      }
    }

    items.sort((a, b) => (a.at < b.at ? 1 : -1));
    res.json({ items: items.slice(0, 80) });
  });

  app.get("/orders", requireAuth, async (req, res) => {
    if (!["admin", "client"].includes(req.auth.role)) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize || "20", 10)));
    const skip = (page - 1) * pageSize;

    let baseWhere =
      req.auth.role === "admin"
        ? {}
        : {
            userId: req.auth.sub,
          };

    const andFilters = [];
    if (req.auth.role === "admin") {
      const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 120) : "";
      if (search) {
        andFilters.push({
          OR: [
            { id: { contains: search, mode: "insensitive" } },
            { userId: { contains: search, mode: "insensitive" } },
            { lines: { some: { description: { contains: search, mode: "insensitive" } } } },
          ],
        });
      }
      const st = typeof req.query.status === "string" ? req.query.status.trim() : "";
      if (st) {
        andFilters.push({ status: st });
      }
    }

    const where =
      andFilters.length === 0 ? baseWhere : { AND: [baseWhere, ...andFilters] };

    const [total, rows] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          lines: true,
          parcels: { select: { id: true, status: true, weightKg: true, createdAt: true } },
        },
      }),
    ]);

    res.json({
      data: rows,
      pagination: { page, pageSize, total },
    });
  });

  /** Agrégats commandes (admin). */
  app.get("/orders/stats", ...adminOnly, async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });
    try {
      const [total, grouped] = await Promise.all([
        prisma.order.count(),
        prisma.order.groupBy({
          by: ["status"],
          _count: { _all: true },
        }),
      ]);
      const byStatus = {};
      for (const g of grouped) {
        byStatus[g.status] = g._count._all;
      }
      res.json({ total, byStatus });
    } catch (e) {
      res.status(500).json({ error: String(e.message || e) });
    }
  });

  app.get("/orders/:id", requireAuth, async (req, res) => {
    if (!["admin", "client"].includes(req.auth.role)) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, email: true, name: true, profile: true } },
        lines: true,
        parcels: { include: { trackingEvents: { orderBy: { createdAt: "desc" }, take: 20 } } },
        procurement: { include: { lines: true } },
        testimonial: { select: { id: true, createdAt: true } },
      },
    });
    if (!order) return res.status(404).json({ error: "Commande introuvable." });
    if (req.auth.role !== "admin" && order.userId !== req.auth.sub) {
      return res.status(403).json({ error: "Accès refusé." });
    }
    const payload = { ...order };
    if (req.auth.role === "admin") {
      const wh = await prisma.warehouseAddress.findFirst({
        where: { isDefault: true },
        orderBy: { createdAt: "asc" },
      });
      if (wh) payload.defaultWarehouse = wh;
    }
    res.json(payload);
  });

  /**
   * Mise à jour du statut commande (admin). Livraison : aligne aussi les colis sur DELIVERED.
   */
  app.patch("/orders/:id", ...adminOnly, async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    const orderId = req.params.id;
    const raw = req.body?.status;
    const status = typeof raw === "string" ? raw.trim().toUpperCase() : "";
    const allowed = ["AWAITING_PAYMENT", "PAID", "DELIVERED", "CANCELLED"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `status invalide (autorisés : ${allowed.join(", ")}).` });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { parcels: { select: { id: true } } },
    });
    if (!order) return res.status(404).json({ error: "Commande introuvable." });

    try {
      const updated = await prisma.$transaction(async (tx) => {
        const o = await tx.order.update({
          where: { id: orderId },
          data: { status },
        });
        if (status === "DELIVERED") {
          await tx.parcel.updateMany({
            where: { orderId },
            data: { status: "DELIVERED" },
          });
        }
        if (status === "AWAITING_PAYMENT") {
          await tx.parcel.updateMany({
            where: { orderId, status: "DELIVERED" },
            data: { status: "CREATED" },
          });
        }
        return o;
      });

      try {
        await prisma.auditLog.create({
          data: {
            actorId: req.auth.sub,
            action: "order.status.updated",
            entityType: "Order",
            entityId: order.id,
            before: { status: order.status },
            after: { status: updated.status },
          },
        });
      } catch (_) {
        /* ignore audit failure */
      }

      // Email de notification au client (non bloquant)
      try {
        const client = await prisma.user.findUnique({
          where: { id: order.userId },
          select: { email: true, name: true },
        });
        if (client?.email) {
          const tpl = orderStatusEmail({
            name: client.name || client.email,
            orderId: order.id,
            status: updated.status,
          });
          sendMail({ to: client.email, ...tpl });
        }
      } catch (_) {
        /* ignore email failure */
      }

      res.json(updated);
    } catch (e) {
      res.status(400).json({ error: String(e.message || e) });
    }
  });

  /**
   * Confirmation de réception par le client : commande + colis passent en livré.
   */
  app.post("/orders/:id/confirm-receipt", requireAuth, async (req, res) => {
    if (req.auth.role !== "client") {
      return res.status(403).json({ error: "Réservé aux clients." });
    }
    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { parcels: true },
    });
    if (!order) return res.status(404).json({ error: "Commande introuvable." });
    if (order.userId !== req.auth.sub) {
      return res.status(403).json({ error: "Accès refusé." });
    }
    if (String(order.status).toUpperCase() === "CANCELLED") {
      return res.status(409).json({ error: "Commande annulée." });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const o = await tx.order.update({
        where: { id: order.id },
        data: { status: "DELIVERED" },
      });
      await tx.parcel.updateMany({
        where: { orderId: order.id },
        data: { status: "DELIVERED" },
      });
      return o;
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.auth.sub,
        action: "order.confirm_receipt",
        entityType: "Order",
        entityId: order.id,
        after: { status: updated.status },
      },
    });

    res.json({ ok: true, orderId: updated.id, status: updated.status });
  });

  /**
   * Témoignage après livraison : 1 par commande, client propriétaire uniquement.
   */
  app.post("/orders/:id/testimonials", requireAuth, async (req, res) => {
    if (req.auth.role !== "client") {
      return res.status(403).json({ error: "Réservé aux clients." });
    }
    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { parcels: true, testimonial: true },
    });
    if (!order) return res.status(404).json({ error: "Commande introuvable." });
    if (order.userId !== req.auth.sub) {
      return res.status(403).json({ error: "Accès refusé." });
    }
    if (!isOrderDelivered(order)) {
      return res.status(400).json({ error: "Témoignage possible uniquement après livraison." });
    }
    if (order.testimonial) {
      return res.status(409).json({ error: "Un témoignage existe déjà pour cette commande." });
    }

    const { clientName, city, country, message, rating, photoDataUrl } = req.body || {};
    const nameTrim = String(clientName || "").trim();
    const cityTrim = String(city || "").trim();
    const countryTrim = String(country || "").trim();
    const msgTrim = String(message || "").trim();

    if (!nameTrim || !cityTrim || !countryTrim) {
      return res.status(400).json({ error: "Nom, ville et pays sont obligatoires." });
    }
    if (msgTrim.length < 20) {
      return res.status(400).json({ error: "Le message doit contenir au moins 20 caractères." });
    }

    let ratingNum = null;
    if (rating != null && rating !== "") {
      const n = parseInt(String(rating), 10);
      if (Number.isNaN(n) || n < 1 || n > 5) {
        return res.status(400).json({ error: "La note doit être entre 1 et 5." });
      }
      ratingNum = n;
    }

    const testimonialId = crypto.randomUUID();
    let photoUrl = null;
    if (photoDataUrl) {
      try {
        photoUrl = await saveTestimonialPhoto({ testimonialId, photoDataUrl });
      } catch (e) {
        const code = e.code || e.message;
        return res.status(400).json({ error: "Photo invalide ou trop volumineuse.", code: String(code) });
      }
    }

    try {
      const row = await prisma.orderTestimonial.create({
        data: {
          id: testimonialId,
          orderId: order.id,
          userId: req.auth.sub,
          clientName: nameTrim,
          city: cityTrim,
          country: countryTrim,
          message: msgTrim,
          rating: ratingNum,
          photoUrl,
        },
      });
      await prisma.auditLog.create({
        data: {
          actorId: req.auth.sub,
          action: "order.testimonial.created",
          entityType: "Order",
          entityId: order.id,
          after: { testimonialId: row.id },
        },
      });
      res.status(201).json(row);
    } catch (e) {
      if (photoUrl) await deleteProofByPublicPath(photoUrl);
      if (e.code === "P2002") {
        return res.status(409).json({ error: "Un témoignage existe déjà pour cette commande." });
      }
      res.status(400).json({ error: String(e.message || e) });
    }
  });

  app.post("/orders", ...clientOrAdmin, async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    if (req.auth.role === "client" && req.body?.userId && req.body.userId !== req.auth.sub) {
      return res.status(403).json({ error: "userId interdit." });
    }

    let userId = req.auth.sub;
    if (req.auth.role === "admin" && req.body.userId) {
      const exists = await prisma.user.findUnique({ where: { id: req.body.userId } });
      if (!exists) return res.status(400).json({ error: "userId invalide." });
      userId = req.body.userId;
    }

    const {
      type,
      deliveryMode,
      currency,
      lines,
      photoDataUrl,
      shippingCountry,
      shippingPhone,
      shippingAddress,
      shippingInstructions,
    } = req.body || {};

    const ship = (v, max) => {
      if (v == null) return "";
      const s = String(v).trim();
      return s.slice(0, max);
    };
    const shipCountry = ship(shippingCountry, 120);
    const shipPhone = ship(shippingPhone, 80);
    const shipAddress = ship(shippingAddress, 500);
    const shipInstr = ship(shippingInstructions, 2000);
    if (!type || !Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ error: "type et lines[] requis." });
    }
    if (!photoDataUrl) {
      return res.status(400).json({ error: "Photo obligatoire pour valider la commande." });
    }
    const mode = String(deliveryMode || "").toUpperCase();
    if (!["AIR", "SEA"].includes(mode)) {
      return res.status(400).json({ error: "deliveryMode requis (AIR ou SEA)." });
    }

    // 1) Stocker la preuve AVANT création DB pour garantir: aucune commande sans photo.
    const orderId = crypto.randomUUID();
    let proofUrl = null;
    try {
      proofUrl = await saveOrderProof({ orderId, photoDataUrl });
    } catch (e) {
      return res.status(400).json({ error: "Photo invalide ou non stockable.", code: String(e.code || "PHOTO_INVALID") });
    }

    try {
      const order = await prisma.$transaction(async (tx) => {
        const o = await tx.order.create({
          data: {
            id: orderId,
            userId,
            type,
            status: "AWAITING_PAYMENT",
            deliveryMode: mode,
            proofImageUrl: proofUrl,
            currency: currency || "EUR",
            lines: {
              create: lines.map((l) => ({
                description: String(l.description || "Article"),
                quantity: Math.max(1, parseInt(l.quantity || 1, 10)),
                unitPrice: new Prisma.Decimal(String(l.unitPrice ?? 0)),
                currency: String(l.currency || currency || "EUR"),
              })),
            },
            parcels: {
              create: {
                status: "CREATED",
              },
            },
          },
          include: { lines: true, parcels: true },
        });
        return o;
      });

      await prisma.auditLog.create({
        data: {
          actorId: req.auth.sub,
          action: "order.proof.upload",
          entityType: "Order",
          entityId: order.id,
          after: { proofImageUrl: proofUrl },
        },
      });

      const shippingEmailBlock = [
        shipCountry || shipPhone || shipAddress || shipInstr ? `` : null,
        shipCountry ? `Pays livraison: ${shipCountry}` : null,
        shipPhone ? `Téléphone: ${shipPhone}` : null,
        shipAddress ? `Adresse: ${shipAddress}` : null,
        shipInstr ? `Instructions: ${shipInstr}` : null,
      ].filter(Boolean);

      async function sendOrderNotifyEmail({ label }) {
        const to = process.env.CUSTOMERCARE_EMAIL || "customercare@lasolution.org";
        const transporter = createSmtpTransporter();
        const actionOk = mode === "AIR" ? "order.air_email.sent" : "order.sea_email.sent";
        const actionFail = mode === "AIR" ? "order.air_email.failed" : "order.sea_email.failed";
        try {
          await transporter.sendMail({
            from: buildMailFrom(),
            to,
            subject: `Nouvelle commande ${label} — ${order.id.slice(0, 8)}`,
            text: [
              `Nouvelle commande ${label}.`,
              ``,
              `OrderId: ${order.id}`,
              `Client: ${req.auth.email} (${req.auth.sub})`,
              `Proof: ${proofUrl || "—"}`,
              ...shippingEmailBlock,
              ``,
              `Lignes:`,
              ...(order.lines || []).map((l) => `- ${l.description} ×${l.quantity} @ ${l.unitPrice} ${l.currency}`),
            ].join("\n"),
          });
          await prisma.auditLog.create({
            data: {
              actorId: req.auth.sub,
              action: actionOk,
              entityType: "Order",
              entityId: order.id,
              after: { to },
            },
          });
        } catch (e) {
          await prisma.auditLog.create({
            data: {
              actorId: req.auth.sub,
              action: actionFail,
              entityType: "Order",
              entityId: order.id,
              after: { error: String(e.message || e) },
            },
          });
        }
      }

      if (mode === "AIR") {
        await sendOrderNotifyEmail({ label: "AIR" });
      } else if (mode === "SEA") {
        await sendOrderNotifyEmail({ label: "MARITIME" });
      }

      res.status(201).json(order);
    } catch (e) {
      // Si la DB échoue après stockage, on évite les artefacts fichiers.
      await deleteProofByPublicPath(proofUrl);
      res.status(400).json({ error: String(e.message || e) });
    }
  });

  app.get("/parcels/:id", requireAuth, async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    const parcel = await prisma.parcel.findUnique({
      where: { id: req.params.id },
      include: {
        order: { select: { id: true, userId: true, status: true } },
        trackingEvents: { orderBy: { createdAt: "desc" }, take: 50 },
        deliveryJobs: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });
    if (!parcel) return res.status(404).json({ error: "Colis introuvable." });

    const ownerId = parcel.order?.userId;
    const allowed =
      req.auth.role === "admin" ||
      (ownerId && ownerId === req.auth.sub) ||
      req.auth.role === "relais" ||
      req.auth.role === "solu_livreur";

    if (!allowed) return res.status(403).json({ error: "Accès refusé." });
    res.json(parcel);
  });

  app.post("/parcels/:id/tracking-events", ...adminOnly, async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    const parcelId = req.params.id;
    const parcel = await prisma.parcel.findUnique({ where: { id: parcelId }, select: { id: true } });
    if (!parcel) return res.status(404).json({ error: "Colis introuvable." });

    const status = typeof req.body?.status === "string" ? req.body.status.trim().slice(0, 80) : "";
    const message = typeof req.body?.message === "string" ? req.body.message.trim().slice(0, 400) : "";
    const meta =
      req.body?.meta && typeof req.body.meta === "object" && !Array.isArray(req.body.meta) ? req.body.meta : null;

    if (!status) return res.status(400).json({ error: "status requis." });

    const created = await prisma.trackingEvent.create({
      data: {
        parcelId,
        status,
        message: message || null,
        meta,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.auth.sub,
        action: "parcel.tracking_event.create",
        entityType: "Parcel",
        entityId: parcelId,
        after: { trackingEventId: created.id, status: created.status },
      },
    });

    res.status(201).json(created);
  });

  app.patch("/parcels/:id", ...adminOnly, async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    const { weightKg, status } = req.body || {};
    const before = await prisma.parcel.findUnique({ where: { id: req.params.id } });
    if (!before) return res.status(404).json({ error: "Colis introuvable." });

    const data = {};
    if (weightKg != null) data.weightKg = new Prisma.Decimal(String(weightKg));
    if (status != null) data.status = String(status);

    const updated = await prisma.parcel.update({
      where: { id: req.params.id },
      data,
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.auth.sub,
        action: "parcel.patch",
        entityType: "Parcel",
        entityId: updated.id,
        before: { weightKg: before.weightKg?.toString(), status: before.status },
        after: { weightKg: updated.weightKg?.toString(), status: updated.status },
      },
    });

    res.json(updated);
  });
}

module.exports = { setupOrderParcelRoutes };
