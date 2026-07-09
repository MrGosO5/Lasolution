const { createSmtpTransporter, buildMailFrom, sendMail } = require("../emails/mailer");
const { sendShippingRequestEmailJs } = require("../emails/emailjsShipping");
const { buildShippingRequestPlainText } = require("../emails/shippingRequestEmail");
const { requireAuth, requireRoles } = require("../middleware/auth");
const {
  isValidStatus,
  saveShippingPhoto,
  resolvePhotoAbs,
  deleteShippingPhoto,
  attachZohoDraft,
  mergeEditableMeta,
  approveZohoForMeta,
  generateLabelForMeta,
  appendCommunication,
  sanitizeMetaForClient,
} = require("../lib/shippingRequestOps");

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

function toBufferFromDataUrl(dataUrl) {
  const m = /^data:([^;]+);base64,(.+)$/.exec(String(dataUrl || ""));
  if (!m) return null;
  try {
    return Buffer.from(m[2], "base64");
  } catch {
    return null;
  }
}

function normalizeTransportMode(raw) {
  const u = String(raw ?? "SEA").toUpperCase();
  if (u === "AIR" || u === "AERIEN" || u === "AÉRIEN") return "AIR";
  return "SEA";
}

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function setupShippingRequestRoutes(app, getPrisma) {
  /**
   * Demande d'expédition (aérien ou maritime) quand le client a déjà commandé ailleurs.
   * Photo obligatoire, poids optionnel.
   * Notifie customercare@lasolution.org.
   *
   * `transportMode`: "AIR" | "SEA" (défaut "SEA"). Un seul endpoint pour éviter les 404
   * si un ancien process backend n’a pas encore la route `/shipping-requests/air`.
   */
  async function handleShippingRequest(req, res, forcedMode) {
    const {
      contactEmail,
      senderName,
      senderPhone,
      pickupAddress,
      recipientName,
      recipientPhone,
      destinationCountry,
      destinationAddress,
      trackingNumber,
      weightKg,
      notes,
      photoDataUrl,
      transportMode: bodyMode,
      mode: legacyMode,
    } = req.body || {};

    const transportMode = forcedMode ?? normalizeTransportMode(bodyMode ?? legacyMode);
    const modeLabel = transportMode === "AIR" ? "aérien" : "maritime";

    if (!isNonEmptyString(senderPhone)) {
      return res.status(400).json({ error: "Téléphone expéditeur obligatoire." });
    }
    if (!isNonEmptyString(recipientPhone)) {
      return res.status(400).json({ error: "Téléphone destinataire obligatoire." });
    }
    if (!isNonEmptyString(recipientName)) {
      return res.status(400).json({ error: "Nom complet du destinataire obligatoire." });
    }
    if (!isNonEmptyString(pickupAddress)) {
      return res.status(400).json({ error: "Adresse complète de récupération obligatoire." });
    }
    if (!isNonEmptyString(destinationAddress)) {
      return res.status(400).json({ error: "Adresse complète de destination obligatoire." });
    }

    if (!photoDataUrl) {
      return res.status(400).json({ error: `Photo obligatoire pour un envoi ${modeLabel}.` });
    }

    const photoBuf = toBufferFromDataUrl(photoDataUrl);
    if (!photoBuf) {
      return res.status(400).json({ error: "Photo invalide (data URL base64 attendu)." });
    }
    if (photoBuf.length > MAX_PHOTO_BYTES) {
      return res.status(400).json({ error: "Photo trop volumineuse (max 5 Mo)." });
    }

    const to = process.env.CUSTOMERCARE_EMAIL || "customercare@lasolution.org";
    const photoMimeMatch = /^data:([^;]+);base64,/.exec(String(photoDataUrl || ""));
    const photoMime = photoMimeMatch ? photoMimeMatch[1] : "image/jpeg";

    const prisma = typeof getPrisma === "function" ? getPrisma() : null;
    if (prisma) {
      try {
        const baseMeta = {
          transportMode,
          trackingNumber: trackingNumber || null,
          senderName: senderName || null,
          senderPhone,
          pickupAddress,
          recipientName,
          recipientPhone,
          destinationCountry: destinationCountry || null,
          destinationAddress,
          weightKg: weightKg != null && weightKg !== "" ? String(weightKg) : null,
          notes: notes ? String(notes).slice(0, 4000) : null,
          photoBytes: photoBuf.length,
        };
        const created = await prisma.securityEvent.create({
          data: {
            type: "shipping_request",
            userId: req.auth?.sub || null,
            email: isNonEmptyString(contactEmail) ? String(contactEmail).trim().slice(0, 320) : null,
            ip: req.ip || null,
            userAgent: (req.get("user-agent") || "").slice(0, 512) || null,
            meta: baseMeta,
          },
        });
        const photoPath = saveShippingPhoto(created.id, photoBuf, photoMime);
        const withPhoto = { ...baseMeta, photoPath };
        await prisma.securityEvent.update({
          where: { id: created.id },
          data: { meta: await attachZohoDraft(withPhoto, created.id) },
        });
      } catch (logErr) {
        console.warn("[shipping-requests] SecurityEvent non enregistré:", logErr?.message || logErr);
      }
    }

    const dest = String(destinationCountry || "").trim() || "Destination";
    const emailPayload = {
      transportMode,
      contactEmail,
      trackingNumber,
      senderName,
      senderPhone,
      pickupAddress,
      recipientName,
      recipientPhone,
      destinationCountry,
      destinationAddress,
      weightKg,
      notes,
      photoBuf,
      photoMime,
    };

    const subject = `[Expédition] Nouvelle demande ${modeLabel} — ${dest}`;
    const body = buildShippingRequestPlainText(emailPayload);

    let emailed = await sendShippingRequestEmailJs(emailPayload);

    if (!emailed) {
      const smtpHost = process.env.SMTP_HOST;
      if (smtpHost && smtpHost !== "localhost") {
        try {
          const transporter = createSmtpTransporter();
          await transporter.sendMail({
            from: buildMailFrom(),
            to,
            subject,
            text: body,
            ...(contactEmail ? { replyTo: String(contactEmail) } : {}),
            attachments: [
              {
                filename: photoMime.includes("png") ? "colis.png" : "colis.jpg",
                content: photoBuf,
              },
            ],
          });
          emailed = true;
          console.log(`[shipping-requests] SMTP fallback → ${to}`);
        } catch (e) {
          console.warn("[shipping-requests] SMTP fallback non envoyé:", e?.message || e);
        }
      }
    }

    if (emailed) {
      res.json({ ok: true, emailed: true });
    } else {
      console.warn("[shipping-requests] email non envoyé (EmailJS + SMTP indisponibles).");
      res.json({
        ok: true,
        emailed: false,
        warning:
          "Votre demande a bien été enregistrée. L’équipe n’a pas reçu l’e-mail automatique (configuration messagerie).",
      });
    }
  }

  app.post("/shipping-requests/maritime", (req, res) => handleShippingRequest(req, res, undefined));

  /** Alias : même logique, `transportMode` dans le corps. */
  app.post("/shipping-requests", (req, res) => handleShippingRequest(req, res, undefined));

  /** Rétrocompat : force le mode aérien si l’ancien frontend appelle encore cette URL. */
  app.post("/shipping-requests/air", (req, res) => handleShippingRequest(req, res, "AIR"));

  // Variante authentifiée (client) : associe la demande au userId.
  app.post("/me/shipping-requests", requireAuth, requireRoles("client"), (req, res) =>
    handleShippingRequest(req, res, undefined)
  );

  // Liste des demandes du client connecté.
  app.get("/me/shipping-requests", requireAuth, requireRoles("client"), async (req, res) => {
    const prisma = typeof getPrisma === "function" ? getPrisma() : null;
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    const rawLimit = req.query?.limit;
    const limit = Math.max(1, Math.min(parseInt(String(rawLimit || "50"), 10) || 50, 200));

    const events = await prisma.securityEvent.findMany({
      where: { type: "shipping_request", userId: req.auth.sub },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, createdAt: true, meta: true },
    });

    res.json({
      events: events.map((ev) => ({
        id: ev.id,
        createdAt: ev.createdAt,
        meta: sanitizeMetaForClient(ev.meta),
      })),
    });
  });
}

function setupAdminShippingRequestRoutes(app, getPrisma) {
  const adminOnly = [requireAuth, requireRoles("admin")];

  async function loadShippingRequest(prisma, id) {
    const event = await prisma.securityEvent.findFirst({
      where: { id, type: "shipping_request" },
      select: {
        id: true,
        userId: true,
        email: true,
        ip: true,
        userAgent: true,
        type: true,
        createdAt: true,
        meta: true,
      },
    });
    return event;
  }

  app.get("/admin/shipping-requests", ...adminOnly, async (req, res) => {
    const prisma = typeof getPrisma === "function" ? getPrisma() : null;
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    const rawLimit = req.query?.limit;
    const limit = Math.max(1, Math.min(parseInt(String(rawLimit || "50"), 10) || 50, 200));

    const events = await prisma.securityEvent.findMany({
      where: { type: "shipping_request" },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        email: true,
        userId: true,
        ip: true,
        userAgent: true,
        type: true,
        createdAt: true,
        meta: true,
      },
    });

    res.json({ events });
  });

  app.get("/admin/shipping-requests/:id", ...adminOnly, async (req, res) => {
    const prisma = typeof getPrisma === "function" ? getPrisma() : null;
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    const event = await loadShippingRequest(prisma, req.params.id);
    if (!event) return res.status(404).json({ error: "Demande introuvable." });

    let clientEmail = event.email;
    if (event.userId) {
      const user = await prisma.user.findUnique({
        where: { id: event.userId },
        select: { email: true, name: true },
      });
      if (user) {
        event.client = user;
        if (!clientEmail) clientEmail = user.email;
      }
    }

    res.json({ event, clientEmail });
  });

  app.patch("/admin/shipping-requests/:id", ...adminOnly, async (req, res) => {
    const prisma = typeof getPrisma === "function" ? getPrisma() : null;
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    const event = await loadShippingRequest(prisma, req.params.id);
    if (!event) return res.status(404).json({ error: "Demande introuvable." });

    const body = req.body || {};
    if (body.status !== undefined && !isValidStatus(body.status)) {
      return res.status(400).json({ error: "Statut invalide." });
    }

    const nextMeta = mergeEditableMeta(event.meta, body);

    const updated = await prisma.securityEvent.update({
      where: { id: event.id },
      data: { meta: nextMeta },
      select: { id: true, email: true, userId: true, createdAt: true, meta: true },
    });

    res.json({ event: updated });
  });

  app.post("/admin/shipping-requests/:id/zoho/approve", ...adminOnly, async (req, res) => {
    const prisma = typeof getPrisma === "function" ? getPrisma() : null;
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    const event = await loadShippingRequest(prisma, req.params.id);
    if (!event) return res.status(404).json({ error: "Demande introuvable." });

    const nextMeta = await approveZohoForMeta(event.meta || {});
    const updated = await prisma.securityEvent.update({
      where: { id: event.id },
      data: { meta: nextMeta },
      select: { id: true, meta: true },
    });

    res.json({
      ok: true,
      zohoDraftId: nextMeta.zohoDraftId,
      zohoInvoiceId: nextMeta.zohoInvoiceId,
      invoiceStatus: nextMeta.invoiceStatus,
      event: updated,
    });
  });

  app.post("/admin/shipping-requests/:id/communicate", ...adminOnly, async (req, res) => {
    const prisma = typeof getPrisma === "function" ? getPrisma() : null;
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    const event = await loadShippingRequest(prisma, req.params.id);
    if (!event) return res.status(404).json({ error: "Demande introuvable." });

    const subject = String(req.body?.subject || "").trim().slice(0, 200);
    const message = String(req.body?.message || "").trim().slice(0, 8000);
    if (!subject || !message) {
      return res.status(400).json({ error: "Sujet et message requis." });
    }

    let to = String(req.body?.to || event.email || "").trim();
    if (!to && event.userId) {
      const user = await prisma.user.findUnique({ where: { id: event.userId }, select: { email: true } });
      to = user?.email || "";
    }
    if (!to) return res.status(400).json({ error: "Email destinataire introuvable." });

    let emailed = false;
    try {
      await sendMail({ to, subject, text: message });
      emailed = Boolean(process.env.SMTP_HOST && process.env.SMTP_HOST !== "localhost");
    } catch (e) {
      console.warn("[shipping-requests] communication:", e?.message || e);
    }

    const nextMeta = appendCommunication(event.meta || {}, {
      channel: "email",
      subject,
      message,
      to,
      ok: emailed,
    });

    const updated = await prisma.securityEvent.update({
      where: { id: event.id },
      data: { meta: nextMeta },
      select: { id: true, meta: true },
    });

    res.json({
      ok: true,
      emailed,
      warning: emailed ? null : "Message enregistré. SMTP non configuré — email non envoyé (voir logs).",
      event: updated,
    });
  });

  app.post("/admin/shipping-requests/:id/label", ...adminOnly, async (req, res) => {
    const prisma = typeof getPrisma === "function" ? getPrisma() : null;
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    const event = await loadShippingRequest(prisma, req.params.id);
    if (!event) return res.status(404).json({ error: "Demande introuvable." });

    const nextMeta = await generateLabelForMeta(event.meta || {}, event.id);
    const updated = await prisma.securityEvent.update({
      where: { id: event.id },
      data: { meta: nextMeta },
      select: { id: true, meta: true },
    });

    res.json({ ok: true, label: nextMeta, event: updated });
  });

  app.get("/admin/shipping-requests/:id/photo", ...adminOnly, async (req, res) => {
    const prisma = typeof getPrisma === "function" ? getPrisma() : null;
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    const event = await loadShippingRequest(prisma, req.params.id);
    if (!event) return res.status(404).json({ error: "Demande introuvable." });

    const photoPath = event.meta?.photoPath;
    const abs = resolvePhotoAbs(photoPath);
    if (!abs) return res.status(404).json({ error: "Photo non disponible pour cette demande." });

    const ext = abs.endsWith(".png") ? "png" : "jpeg";
    res.setHeader("Content-Type", `image/${ext}`);
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.sendFile(abs);
  });

  app.delete("/admin/shipping-requests/:id", ...adminOnly, async (req, res) => {
    const prisma = typeof getPrisma === "function" ? getPrisma() : null;
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    const event = await loadShippingRequest(prisma, req.params.id);
    if (!event) return res.status(404).json({ error: "Demande introuvable." });

    deleteShippingPhoto(event.meta?.photoPath);

    await prisma.securityEvent.delete({ where: { id: event.id } });

    res.json({ ok: true, id: event.id });
  });

  console.log(
    "[shipping-requests] Routes admin: GET/PATCH/DELETE /admin/shipping-requests/:id, zoho/approve, communicate, label, photo",
  );
}

module.exports = { setupShippingRequestRoutes, setupAdminShippingRequestRoutes };

