const crypto = require("crypto");
const { requireAuth, requireRoles } = require("../middleware/auth");
const { saveTestimonialPhoto, deleteProofByPublicPath } = require("../utils/mediaProof");
const { validateTestimonialContent } = require("../utils/testimonialContent");

const TESTIMONIAL_SELECT_PUBLIC = {
  id: true,
  clientName: true,
  city: true,
  country: true,
  message: true,
  rating: true,
  photoUrl: true,
  createdAt: true,
  reviewedAt: true,
};

const TESTIMONIAL_SELECT_CLIENT = {
  id: true,
  orderId: true,
  shippingRequestId: true,
  clientName: true,
  city: true,
  country: true,
  message: true,
  rating: true,
  photoUrl: true,
  status: true,
  rejectReason: true,
  createdAt: true,
  updatedAt: true,
  reviewedAt: true,
};

function isOrderDelivered(order) {
  if (!order) return false;
  if (String(order.status || "").toUpperCase() === "DELIVERED") return true;
  const parcels = order.parcels || [];
  if (parcels.length === 0) return false;
  return parcels.every((p) => String(p.status || "").toUpperCase() === "DELIVERED");
}

function shippingMetaStatus(event) {
  if (!event?.meta || typeof event.meta !== "object") return "";
  return String(event.meta.status || "").toUpperCase();
}

function isShippingRequestDelivered(event) {
  return shippingMetaStatus(event) === "DELIVERED";
}

async function loadOwnedShippingRequest(prisma, id, userId) {
  return prisma.securityEvent.findFirst({
    where: { id, type: "shipping_request", userId },
    select: { id: true, userId: true, meta: true },
  });
}

function parseTestimonialFields(body) {
  const { rating } = body || {};
  const validated = validateTestimonialContent(body || {});
  if (validated.error) return validated;

  let ratingNum = null;
  if (rating != null && rating !== "") {
    const n = parseInt(String(rating), 10);
    if (Number.isNaN(n) || n < 1 || n > 5) {
      return { error: "La note doit être entre 1 et 5." };
    }
    ratingNum = n;
  }

  return { data: { ...validated.data, rating: ratingNum } };
}

function testimonialAuditSnapshot(row) {
  return {
    status: row.status,
    clientName: row.clientName,
    city: row.city,
    country: row.country,
    rating: row.rating,
  };
}

function publicTestimonialsWhere() {
  const includeDemo =
    process.env.NODE_ENV !== "production" &&
    process.env.INCLUDE_DEMO_TESTIMONIALS === "true";
  return {
    status: "APPROVED",
    ...(includeDemo ? {} : { isDemo: false }),
  };
}

async function resolvePhotoUrl({ testimonialId, photoDataUrl, removePhoto, existingPhotoUrl }) {
  if (removePhoto === true) {
    if (existingPhotoUrl) await deleteProofByPublicPath(existingPhotoUrl);
    return null;
  }
  if (!photoDataUrl) return undefined;
  if (existingPhotoUrl) await deleteProofByPublicPath(existingPhotoUrl);
  return saveTestimonialPhoto({ testimonialId, photoDataUrl });
}

/** Liste des avis du client connecté (enregistrée aussi depuis ordersParcels pour compatibilité). */
function registerMeTestimonialsListRoute(app, getPrisma) {
  app.get("/me/testimonials", requireAuth, async (req, res) => {
    if (req.auth.role !== "client") {
      return res.status(403).json({ error: "Réservé aux clients." });
    }
    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize || "25", 10)));
    const skip = (page - 1) * pageSize;

    try {
      const where = { userId: req.auth.sub };
      const [total, rows] = await Promise.all([
        prisma.orderTestimonial.count({ where }),
        prisma.orderTestimonial.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" },
          select: {
            ...TESTIMONIAL_SELECT_CLIENT,
            order: { select: { id: true, status: true, createdAt: true } },
          },
        }),
      ]);
      res.json({ data: rows, pagination: { page, pageSize, total } });
    } catch (e) {
      res.status(500).json({ error: String(e.message || e) });
    }
  });
}

function setupTestimonialRoutes(app, getPrisma) {
  const adminGuard = [requireAuth, requireRoles("admin")];

  app.get("/public/testimonials", async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    const limit = Math.min(24, Math.max(1, parseInt(req.query.limit || "12", 10)));
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const skip = (page - 1) * limit;

    try {
      const where = publicTestimonialsWhere();
      const [total, data] = await Promise.all([
        prisma.orderTestimonial.count({ where }),
        prisma.orderTestimonial.findMany({
          where,
          orderBy: [{ reviewedAt: "desc" }, { createdAt: "desc" }],
          skip,
          take: limit,
          select: TESTIMONIAL_SELECT_PUBLIC,
        }),
      ]);
      res.json({ data, pagination: { page, pageSize: limit, total } });
    } catch (e) {
      res.status(500).json({ error: String(e.message || e) });
    }
  });

  app.get("/admin/testimonials", ...adminGuard, async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize || "25", 10)));
    const skip = (page - 1) * pageSize;
    const status = typeof req.query.status === "string" ? req.query.status.trim().toUpperCase() : "";
    const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 120) : "";

    const searchWhere = {};
    if (search) {
      searchWhere.OR = [
        { clientName: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { country: { contains: search, mode: "insensitive" } },
        { message: { contains: search, mode: "insensitive" } },
        { orderId: { contains: search, mode: "insensitive" } },
        { shippingRequestId: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const where = { ...searchWhere };
    if (["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      where.status = status;
    }

    try {
      const [total, countAll, countPending, countApproved, countRejected, rows] = await Promise.all([
        prisma.orderTestimonial.count({ where }),
        prisma.orderTestimonial.count({ where: searchWhere }),
        prisma.orderTestimonial.count({ where: { ...searchWhere, status: "PENDING" } }),
        prisma.orderTestimonial.count({ where: { ...searchWhere, status: "APPROVED" } }),
        prisma.orderTestimonial.count({ where: { ...searchWhere, status: "REJECTED" } }),
        prisma.orderTestimonial.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" },
          select: {
            ...TESTIMONIAL_SELECT_CLIENT,
            user: { select: { id: true, email: true, name: true } },
            order: { select: { id: true, status: true } },
          },
        }),
      ]);
      res.json({
        data: rows,
        pagination: { page, pageSize, total },
        counts: {
          all: countAll,
          PENDING: countPending,
          APPROVED: countApproved,
          REJECTED: countRejected,
        },
      });
    } catch (e) {
      res.status(500).json({ error: String(e.message || e) });
    }
  });

  app.get("/admin/testimonials/:id", ...adminGuard, async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    try {
      const row = await prisma.orderTestimonial.findUnique({
        where: { id: req.params.id },
        select: {
          ...TESTIMONIAL_SELECT_CLIENT,
          user: { select: { id: true, email: true, name: true } },
          order: { select: { id: true, status: true, createdAt: true } },
        },
      });
      if (!row) return res.status(404).json({ error: "Avis introuvable." });
      res.json(row);
    } catch (e) {
      res.status(500).json({ error: String(e.message || e) });
    }
  });

  app.patch("/admin/testimonials/:id", ...adminGuard, async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    const nextStatus = String(req.body?.status || "").toUpperCase();
    if (!["APPROVED", "REJECTED", "PENDING"].includes(nextStatus)) {
      return res.status(400).json({ error: "status attendu : APPROVED, REJECTED ou PENDING." });
    }

    const rejectReason =
      typeof req.body?.rejectReason === "string" ? req.body.rejectReason.trim().slice(0, 2000) : null;

    if (nextStatus === "REJECTED" && !rejectReason) {
      return res.status(400).json({ error: "Un motif de refus est requis." });
    }

    const existing = await prisma.orderTestimonial.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Avis introuvable." });

    const now = new Date();
    const data = {
      status: nextStatus,
      rejectReason: nextStatus === "REJECTED" ? rejectReason : null,
      reviewedAt: nextStatus === "PENDING" ? null : now,
      reviewedBy: nextStatus === "PENDING" ? null : req.auth.sub,
    };

    try {
      const row = await prisma.orderTestimonial.update({
        where: { id: existing.id },
        data,
        select: {
          ...TESTIMONIAL_SELECT_CLIENT,
          user: { select: { id: true, email: true, name: true } },
          order: { select: { id: true, status: true } },
        },
      });
      await prisma.auditLog.create({
        data: {
          actorId: req.auth.sub,
          action: `testimonial.${nextStatus.toLowerCase()}`,
          entityType: "OrderTestimonial",
          entityId: row.id,
          before: { status: existing.status },
          after: {
            testimonialId: row.id,
            oldStatus: existing.status,
            newStatus: row.status,
            reason: row.rejectReason ?? null,
          },
        },
      });
      res.json(row);
    } catch (e) {
      res.status(400).json({ error: String(e.message || e) });
    }
  });

  app.get("/orders/:id/testimonials", requireAuth, async (req, res) => {
    if (req.auth.role !== "client") {
      return res.status(403).json({ error: "Réservé aux clients." });
    }
    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      select: { id: true, userId: true },
    });
    if (!order) return res.status(404).json({ error: "Commande introuvable." });
    if (order.userId !== req.auth.sub) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    const row = await prisma.orderTestimonial.findUnique({
      where: { orderId: order.id },
      select: TESTIMONIAL_SELECT_CLIENT,
    });
    if (!row) return res.status(404).json({ error: "Aucun avis pour cette commande." });
    res.json(row);
  });

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

    const parsed = parseTestimonialFields(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });

    const { photoDataUrl } = req.body || {};
    const testimonialId = crypto.randomUUID();
    let photoUrl = null;
    if (photoDataUrl) {
      try {
        photoUrl = await saveTestimonialPhoto({ testimonialId, photoDataUrl });
      } catch (e) {
        return res.status(400).json({ error: "Photo invalide ou trop volumineuse.", code: String(e.code || e.message) });
      }
    }

    try {
      const row = await prisma.orderTestimonial.create({
        data: {
          id: testimonialId,
          orderId: order.id,
          userId: req.auth.sub,
          ...parsed.data,
          photoUrl,
          status: "PENDING",
        },
        select: TESTIMONIAL_SELECT_CLIENT,
      });
      await prisma.auditLog.create({
        data: {
          actorId: req.auth.sub,
          action: "order.testimonial.created",
          entityType: "Order",
          entityId: order.id,
          after: { testimonialId: row.id, status: row.status },
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

  app.patch("/orders/:id/testimonials", requireAuth, async (req, res) => {
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
    if (!order.testimonial) {
      return res.status(404).json({ error: "Aucun avis pour cette commande." });
    }
    if (order.testimonial.status === "APPROVED") {
      return res.status(409).json({ error: "Un avis publié ne peut plus être modifié." });
    }

    const parsed = parseTestimonialFields(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });

    const { photoDataUrl, removePhoto } = req.body || {};
    let photoUrl;
    try {
      photoUrl = await resolvePhotoUrl({
        testimonialId: order.testimonial.id,
        photoDataUrl,
        removePhoto: removePhoto === true,
        existingPhotoUrl: order.testimonial.photoUrl,
      });
    } catch (e) {
      return res.status(400).json({ error: "Photo invalide ou trop volumineuse.", code: String(e.code || e.message) });
    }

    const updateData = {
      ...parsed.data,
      status: "PENDING",
      rejectReason: null,
      reviewedAt: null,
      reviewedBy: null,
    };
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;

    try {
      const row = await prisma.orderTestimonial.update({
        where: { id: order.testimonial.id },
        data: updateData,
        select: TESTIMONIAL_SELECT_CLIENT,
      });
      await prisma.auditLog.create({
        data: {
          actorId: req.auth.sub,
          action: "order.testimonial.updated",
          entityType: "OrderTestimonial",
          entityId: row.id,
          before: testimonialAuditSnapshot(order.testimonial),
          after: {
            testimonialId: row.id,
            ...testimonialAuditSnapshot(row),
          },
        },
      });
      res.json(row);
    } catch (e) {
      res.status(400).json({ error: String(e.message || e) });
    }
  });

  app.get("/me/shipping-requests/:id/testimonials", requireAuth, async (req, res) => {
    if (req.auth.role !== "client") {
      return res.status(403).json({ error: "Réservé aux clients." });
    }
    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    const event = await loadOwnedShippingRequest(prisma, req.params.id, req.auth.sub);
    if (!event) return res.status(404).json({ error: "Demande d'expédition introuvable." });

    const row = await prisma.orderTestimonial.findUnique({
      where: { shippingRequestId: event.id },
      select: TESTIMONIAL_SELECT_CLIENT,
    });
    if (!row) return res.status(404).json({ error: "Aucun avis pour cette expédition." });
    res.json(row);
  });

  app.post("/me/shipping-requests/:id/testimonials", requireAuth, async (req, res) => {
    if (req.auth.role !== "client") {
      return res.status(403).json({ error: "Réservé aux clients." });
    }
    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    const event = await loadOwnedShippingRequest(prisma, req.params.id, req.auth.sub);
    if (!event) return res.status(404).json({ error: "Demande d'expédition introuvable." });
    if (!isShippingRequestDelivered(event)) {
      return res.status(400).json({ error: "Témoignage possible uniquement après livraison." });
    }

    const existing = await prisma.orderTestimonial.findUnique({
      where: { shippingRequestId: event.id },
      select: { id: true },
    });
    if (existing) {
      return res.status(409).json({ error: "Un témoignage existe déjà pour cette expédition." });
    }

    const parsed = parseTestimonialFields(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });

    const { photoDataUrl } = req.body || {};
    const testimonialId = crypto.randomUUID();
    let photoUrl = null;
    if (photoDataUrl) {
      try {
        photoUrl = await saveTestimonialPhoto({ testimonialId, photoDataUrl });
      } catch (e) {
        return res.status(400).json({ error: "Photo invalide ou trop volumineuse.", code: String(e.code || e.message) });
      }
    }

    try {
      const row = await prisma.orderTestimonial.create({
        data: {
          id: testimonialId,
          shippingRequestId: event.id,
          userId: req.auth.sub,
          ...parsed.data,
          photoUrl,
          status: "PENDING",
        },
        select: TESTIMONIAL_SELECT_CLIENT,
      });
      await prisma.auditLog.create({
        data: {
          actorId: req.auth.sub,
          action: "shipping_request.testimonial.created",
          entityType: "SecurityEvent",
          entityId: event.id,
          after: { testimonialId: row.id, status: row.status },
        },
      });
      res.status(201).json(row);
    } catch (e) {
      if (photoUrl) await deleteProofByPublicPath(photoUrl);
      if (e.code === "P2002") {
        return res.status(409).json({ error: "Un témoignage existe déjà pour cette expédition." });
      }
      res.status(400).json({ error: String(e.message || e) });
    }
  });

  app.patch("/me/shipping-requests/:id/testimonials", requireAuth, async (req, res) => {
    if (req.auth.role !== "client") {
      return res.status(403).json({ error: "Réservé aux clients." });
    }
    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    const event = await loadOwnedShippingRequest(prisma, req.params.id, req.auth.sub);
    if (!event) return res.status(404).json({ error: "Demande d'expédition introuvable." });

    const testimonial = await prisma.orderTestimonial.findUnique({
      where: { shippingRequestId: event.id },
    });
    if (!testimonial) {
      return res.status(404).json({ error: "Aucun avis pour cette expédition." });
    }
    if (testimonial.status === "APPROVED") {
      return res.status(409).json({ error: "Un avis publié ne peut plus être modifié." });
    }

    const parsed = parseTestimonialFields(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });

    const { photoDataUrl, removePhoto } = req.body || {};
    let photoUrl;
    try {
      photoUrl = await resolvePhotoUrl({
        testimonialId: testimonial.id,
        photoDataUrl,
        removePhoto: removePhoto === true,
        existingPhotoUrl: testimonial.photoUrl,
      });
    } catch (e) {
      return res.status(400).json({ error: "Photo invalide ou trop volumineuse.", code: String(e.code || e.message) });
    }

    const updateData = { ...parsed.data, status: "PENDING", rejectReason: null };
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;

    try {
      const row = await prisma.orderTestimonial.update({
        where: { id: testimonial.id },
        data: updateData,
        select: TESTIMONIAL_SELECT_CLIENT,
      });
      await prisma.auditLog.create({
        data: {
          actorId: req.auth.sub,
          action: "shipping_request.testimonial.updated",
          entityType: "SecurityEvent",
          entityId: event.id,
          before: testimonialAuditSnapshot(testimonial),
          after: {
            testimonialId: row.id,
            ...testimonialAuditSnapshot(row),
          },
        },
      });
      res.json(row);
    } catch (e) {
      res.status(400).json({ error: String(e.message || e) });
    }
  });
}

module.exports = {
  setupTestimonialRoutes,
  registerMeTestimonialsListRoute,
  isOrderDelivered,
  isShippingRequestDelivered,
};
