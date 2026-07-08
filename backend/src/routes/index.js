const { resolvePaymentRoute } = require("../payment/router");
const { createPaymentIntent } = require("../integrations/psp");
const { recordWebhook } = require("../webhooks/pspIngest");
const { createDraftInvoice, approveInvoice } = require("../integrations/zohoBooks");
const { CarrierAdapter } = require("../carriers/adapter");
const { Prisma } = require("@prisma/client");
const crypto = require("crypto");
const { hashPassword } = require("../auth/password");
const { setupAuthRoutes } = require("./authRoutes");
const { setupMfaRoutes } = require("./mfaRoutes");
const { revokeAllUserRefreshTokens } = require("../auth/tokens");
const { validatePasswordPolicy } = require("../auth/passwordPolicy");
const { requireTurnstile } = require("../middleware/turnstile");
const { RESET_CAPTCHA_THRESHOLD, countRecentSecurityEvents } = require("./authRoutes");
const { setupOrderParcelRoutes } = require("./ordersParcels");
const { setupTestimonialRoutes } = require("./testimonials");
const { setupMissionRoutes } = require("./missions");
const { setupShippingRequestRoutes, setupAdminShippingRequestRoutes } = require("./shippingRequests");
const { requireAuth, requireRoles, strictRateLimit } = require("../middleware/auth");
const { sendMail, createSmtpTransporter, buildMailFrom } = require("../emails/mailer");
const {
  sendComingSoonWaitlistEmailJs,
  sendComingSoonNewsletterEmailJs,
} = require("../emails/emailjsComingSoon");
const { passwordResetEmail } = require("../emails/templates");
const {
  submitApplication,
  acceptApplication,
  refuseApplication,
  getApplicationDocument,
  ApplicationError,
  APPLICATION_TYPES,
} = require("../services/applicationService");
const { ALL_APPLICATION_TYPES } = require("../constants/applications");

const APPLICATION_BODY_MAX_BYTES = 8 * 1024 * 1024; // 8 Mo — candidatures avec documents base64

/** Rejette tôt les payloads trop volumineux (plan point 10). */
function applicationBodyLimit(req, res, next) {
  const raw = req.get("content-length");
  if (!raw) return next();
  const len = parseInt(raw, 10);
  if (Number.isFinite(len) && len > APPLICATION_BODY_MAX_BYTES) {
    return res.status(413).json({ error: "Payload trop volumineux (max 8 Mo)." });
  }
  next();
}

function getPrisma() {
  try {
    return require("../db").prisma;
  } catch {
    return null;
  }
}

function setupPaymentRoutes(app) {
  app.post("/payments/route", (req, res) => {
    const { countryCode, currency, method } = req.body || {};
    if (!countryCode) {
      return res.status(400).json({ error: "countryCode requis." });
    }
    const route = resolvePaymentRoute({ countryCode, currency, method });
    res.json(route);
  });

  app.post("/payments/intent", async (req, res) => {
    const { provider, amount, currency, orderId, idempotencyKey } = req.body || {};
    if (amount == null || !currency) {
      return res.status(400).json({ error: "amount et currency requis." });
    }
    const p = provider || "stripe";
    const prisma = getPrisma();
    try {
      const intent = await createPaymentIntent({
        provider: p,
        amount: Number(amount),
        currency,
        orderId,
        idempotencyKey,
      });
      if (prisma && intent.providerIntentId) {
        try {
          await prisma.payment.create({
            data: {
              provider: p,
              providerIntentId: intent.providerIntentId,
              idempotencyKey: idempotencyKey || null,
              amount: new Prisma.Decimal(String(amount)),
              currency: String(currency),
              status: intent.status || "pending",
              rawMeta: intent,
            },
          });
        } catch (pe) {
          if (pe.code !== "P2002") throw pe;
        }
      }
      res.json(intent);
    } catch (e) {
      res.status(500).json({ error: String(e.message || e) });
    }
  });
}

function setupWebhookRoutes(app) {
  /** Stripe : voir `mountStripeWebhook` dans server.js (corps brut + signature). */
  app.post("/webhooks/psp/:provider", async (req, res) => {
    const provider = req.params.provider;
    if (provider === "stripe") {
      return res.status(400).json({
        error: "Stripe : utiliser POST /webhooks/psp/stripe avec le corps brut signé (voir server.js).",
      });
    }
    const eventId =
      req.body?.id ||
      req.body?.data?.id ||
      `${provider}-${Date.now()}`;
    const prisma = getPrisma();
    try {
      const { duplicate } = await recordWebhook({
        prisma,
        provider,
        eventId: String(eventId),
        payload: req.body,
      });
      res.status(200).json({ received: true, duplicate });
    } catch (e) {
      res.status(500).json({ error: String(e.message || e) });
    }
  });
}

function setupBillingStubRoutes(app) {
  const guard = [requireAuth, requireRoles("admin")];

  app.post("/billing/zoho/draft", ...guard, async (req, res) => {
    const { orderId, lines } = req.body || {};
    const out = await createDraftInvoice({ orderId, lines });
    res.json(out);
  });

  app.post("/billing/zoho/approve", ...guard, async (req, res) => {
    const { zohoDraftId } = req.body || {};
    if (!zohoDraftId) return res.status(400).json({ error: "zohoDraftId requis." });
    const out = await approveInvoice({ zohoDraftId });
    res.json(out);
  });
}

function setupCarrierRoutes(app) {
  const adapter = new CarrierAdapter(process.env.CARRIER_NAME || "stub");
  const guard = [requireAuth, requireRoles("admin")];

  app.post("/carriers/shipment", ...guard, async (req, res) => {
    const { parcelId, weightKg, toAddress } = req.body || {};
    if (!parcelId) return res.status(400).json({ error: "parcelId requis." });
    const out = await adapter.createShipment({ parcelId, weightKg, toAddress });
    res.json(out);
  });
}

function setupPartnerOpsRoutes(app) {
  const prismaGetter = getPrisma;

  app.get("/me/shifts", requireAuth, requireRoles("solu_livreur"), async (req, res) => {
    const prisma = prismaGetter();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });
    const data = await prisma.driverShift.findMany({
      where: { userId: req.auth.sub },
      orderBy: { startAt: "asc" },
    });
    res.json({ data });
  });

  app.put("/me/shifts", requireAuth, requireRoles("solu_livreur"), async (req, res) => {
    const prisma = prismaGetter();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });
    const { shifts } = req.body || {};
    if (!Array.isArray(shifts)) {
      return res.status(400).json({ error: "shifts[] requis (startAt, endAt ISO)." });
    }
    const userId = req.auth.sub;
    await prisma.$transaction(async (tx) => {
      await tx.driverShift.deleteMany({ where: { userId } });
      for (const s of shifts) {
        if (!s.startAt || !s.endAt) continue;
        await tx.driverShift.create({
          data: {
            userId,
            startAt: new Date(s.startAt),
            endAt: new Date(s.endAt),
            zoneId: s.zoneId || null,
          },
        });
      }
    });
    res.json({ ok: true });
  });

  app.get("/delivery-jobs", requireAuth, requireRoles("solu_livreur"), async (req, res) => {
    const prisma = prismaGetter();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });
    const data = await prisma.deliveryJob.findMany({
      where: { status: "OFFERED" },
      include: { parcel: { include: { order: { select: { id: true, status: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({ data });
  });

  app.post("/delivery-jobs/:id/accept", requireAuth, requireRoles("solu_livreur"), async (req, res) => {
    const prisma = prismaGetter();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });
    const id = req.params.id;
    try {
      const updated = await prisma.$transaction(async (tx) => {
        const job = await tx.deliveryJob.findUnique({ where: { id } });
        if (!job || job.status !== "OFFERED") {
          throw new Error("JOB_NOT_AVAILABLE");
        }
        return tx.deliveryJob.update({
          where: { id },
          data: { status: "ASSIGNED", driverUserId: req.auth.sub },
        });
      });
      res.json(updated);
    } catch (e) {
      if (String(e.message) === "JOB_NOT_AVAILABLE") {
        return res.status(409).json({ error: "Course non disponible." });
      }
      res.status(400).json({ error: String(e.message || e) });
    }
  });

  app.get("/me/commissions/daily", requireAuth, requireRoles("ambassadeur"), async (req, res) => {
    const prisma = prismaGetter();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });
    const wallet = await prisma.wallet.findUnique({ where: { userId: req.auth.sub } });
    if (!wallet) {
      return res.json({ data: [], totals: {} });
    }
    const from = req.query.from ? new Date(String(req.query.from)) : new Date(Date.now() - 30 * 864e5);
    const to = req.query.to ? new Date(String(req.query.to)) : new Date();
    const entries = await prisma.ledgerEntry.findMany({
      where: { walletId: wallet.id, createdAt: { gte: from, lte: to } },
      orderBy: { createdAt: "desc" },
    });
    const byDay = {};
    for (const e of entries) {
      const day = e.createdAt.toISOString().slice(0, 10);
      if (!byDay[day]) byDay[day] = { credits: 0, count: 0 };
      const n = Number(e.amount);
      byDay[day].credits += n;
      byDay[day].count += 1;
    }
    res.json({ data: byDay, rawCount: entries.length });
  });
}

/**
 * Formulaire public Support (site vitrine) — enregistre un événement et tente un email vers CUSTOMERCARE_EMAIL.
 */
function setupPublicContactRoute(app) {
  app.post("/public/contact", async (req, res) => {
    const prisma = getPrisma();
    const body = req.body || {};
    const clean = (s, max) => (typeof s === "string" ? s.trim().slice(0, max) : "");
    const name = clean(body.name, 200);
    const email = clean(body.email, 320);
    const topic = clean(body.topic, 80) || "autre";
    const reference = clean(body.reference, 80);
    const message = clean(body.message, 8000);
    if (!name || !email || !message) {
      return res.status(400).json({ error: "nom, email et message requis." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "email invalide." });
    }
    if (!prisma) {
      return res.status(503).json({ error: "Base indisponible." });
    }
    try {
      await prisma.securityEvent.create({
        data: {
          type: "support_contact",
          email,
          ip: req.ip || null,
          userAgent: (req.get("user-agent") || "").slice(0, 512) || null,
          meta: { name, topic, reference: reference || null, message },
        },
      });
    } catch (e) {
      return res.status(500).json({ error: String(e.message || e) });
    }

    const to = process.env.CUSTOMERCARE_EMAIL || "customercare@lasolution.org";
    const text = [
      "Nouveau message depuis le formulaire Support du site.",
      "",
      `Nom: ${name}`,
      `Email: ${email}`,
      `Sujet: ${topic}`,
      `Référence: ${reference || "—"}`,
      "",
      message,
    ].join("\n");
    try {
      const transporter = createSmtpTransporter();
      await transporter.sendMail({
        from: buildMailFrom(),
        to,
        subject: `[Support] ${topic} — ${name}`,
        text,
        replyTo: email,
      });
    } catch (mailErr) {
      console.warn("[public/contact] email non envoyé:", mailErr?.message || mailErr);
    }

    res.json({ ok: true });
  });
}

/**
 * Liste d’attente page Coming Soon — SecurityEvent + email vers CUSTOMERCARE_EMAIL (SMTP si configuré).
 */
function isValidPhoneDialCode(dial) {
  return typeof dial === "string" && /^\+\d{1,4}$/.test(dial);
}

function setupPublicComingSoonWaitlistRoute(app) {
  app.post("/public/coming-soon-waitlist", async (req, res) => {
    const prisma = getPrisma();
    const body = req.body || {};
    const clean = (s, max) => (typeof s === "string" ? s.trim().slice(0, max) : "");
    const articleLinksFrom = (value) =>
      clean(value, 4000)
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    const profileRaw = clean(body.profile, 20).toLowerCase();
    const profile = profileRaw === "pro" ? "pro" : profileRaw === "buyer" ? "buyer" : "";
    const name = clean(body.name, 200);
    const email = clean(body.email, 320).toLowerCase();
    const phoneDial = clean(body.phoneDial, 12);
    const phoneLocal = clean(body.phone, 40);
    let articleLinks = articleLinksFrom(body.articleUrl);
    let articleUrl = articleLinks.join("\n");

    if (!profile) {
      return res.status(400).json({ error: "Profil invalide (buyer ou pro attendu)." });
    }
    if (!name || !email || !phoneLocal) {
      return res.status(400).json({ error: "Nom, email et téléphone requis." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Email invalide." });
    }
    if (!phoneDial || !isValidPhoneDialCode(phoneDial)) {
      return res.status(400).json({ error: "Indicatif téléphonique invalide." });
    }
    if (profile === "buyer") {
      if (articleLinks.length === 0) {
        return res.status(400).json({ error: "Au moins une URL d’article est requise pour l’achat assisté." });
      }
      for (const link of articleLinks) {
        try {
          const u = new URL(link);
          if (u.protocol !== "http:" && u.protocol !== "https:") {
            return res.status(400).json({ error: "URL d’article invalide (http ou https requis)." });
          }
        } catch {
          return res.status(400).json({ error: `URL d’article invalide : ${link}` });
        }
      }
      articleUrl = articleLinks.join("\n");
    } else {
      articleLinks = [];
      articleUrl = "";
    }

    if (!prisma) {
      return res.status(503).json({ error: "Base indisponible." });
    }

    const fullPhone = `${phoneDial} ${phoneLocal}`.trim();
    const meta = {
      profile,
      name,
      articleUrl: articleUrl || null,
      articleLinks,
      phoneDial,
      phoneLocal,
      fullPhone,
      submittedAt: new Date().toISOString(),
    };

    try {
      await prisma.securityEvent.create({
        data: {
          type: "coming_soon_waitlist",
          email,
          ip: req.ip || null,
          userAgent: (req.get("user-agent") || "").slice(0, 512) || null,
          meta,
        },
      });
    } catch (e) {
      return res.status(500).json({ error: String(e.message || e) });
    }

    const sentEmailJs = await sendComingSoonWaitlistEmailJs({
      profile,
      name,
      email,
      phoneDial,
      phone: phoneLocal,
      articleUrl: articleUrl || "",
    });
    if (!sentEmailJs) {
      console.warn(
        "[public/coming-soon-waitlist] EmailJS : envoi non effectué (EMAILJS_PRIVATE_KEY absente ou erreur API).",
      );
    }

    res.json({ ok: true });
  });
}

/**
 * Newsletter Coming Soon (email seul) — SecurityEvent + email équipe.
 */
function setupPublicComingSoonNewsletterRoute(app) {
  app.post("/public/coming-soon-newsletter", async (req, res) => {
    const prisma = getPrisma();
    const body = req.body || {};
    const clean = (s, max) => (typeof s === "string" ? s.trim().slice(0, max) : "");
    const email = clean(body.email, 320).toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Email valide requis." });
    }
    if (!prisma) {
      return res.status(503).json({ error: "Base indisponible." });
    }
    try {
      await prisma.securityEvent.create({
        data: {
          type: "coming_soon_newsletter",
          email,
          ip: req.ip || null,
          userAgent: (req.get("user-agent") || "").slice(0, 512) || null,
          meta: { submittedAt: new Date().toISOString() },
        },
      });
    } catch (e) {
      return res.status(500).json({ error: String(e.message || e) });
    }

    const sentEmailJs = await sendComingSoonNewsletterEmailJs(email);
    if (!sentEmailJs) {
      console.warn(
        "[public/coming-soon-newsletter] EmailJS : envoi non effectué (EMAILJS_PRIVATE_KEY absente ou erreur API).",
      );
    }

    res.json({ ok: true });
  });
}

/**
 * Déclaration de voyage SoluPacker — enregistrement + email optionnel vers CUSTOMERCARE_EMAIL.
 */
function setupPublicTripDeclaration(app) {
  app.post("/public/trip-declaration", async (req, res) => {
    const prisma = getPrisma();
    const body = req.body || {};
    const clean = (s, max) => (typeof s === "string" ? s.trim().slice(0, max) : "");
    const departCountry = clean(body.departCountry, 80);
    const departCity = clean(body.departCity, 120);
    const destCountry = clean(body.destCountry, 80);
    const destCity = clean(body.destCity, 120);
    const departDate = clean(body.departDate, 80);
    const arriveDate = clean(body.arriveDate, 80);
    const flightNumber = clean(body.flightNumber, 40);
    const weightKg = clean(body.weightKg, 32);
    const contactEmail = clean(body.contactEmail, 320);
    const certified = body.certified === true || body.certified === "true";

    if (!departCountry || !departCity || !destCountry || !destCity) {
      return res.status(400).json({ error: "Pays et villes de départ / d’arrivée requis." });
    }
    if (!certified) {
      return res.status(400).json({ error: "Vous devez certifier l’exactitude des informations." });
    }
    if (!prisma) {
      return res.status(503).json({ error: "Base indisponible." });
    }
    try {
      await prisma.securityEvent.create({
        data: {
          type: "trip_declaration",
          email: contactEmail || null,
          ip: req.ip || null,
          userAgent: (req.get("user-agent") || "").slice(0, 512) || null,
          meta: {
            departCountry,
            departCity,
            destCountry,
            destCity,
            departDate,
            arriveDate,
            flightNumber,
            weightKg,
            certified,
          },
        },
      });
    } catch (e) {
      return res.status(500).json({ error: String(e.message || e) });
    }

    const to = process.env.CUSTOMERCARE_EMAIL || "customercare@lasolution.org";
    const text = [
      "Nouvelle déclaration de voyage (SoluPacker).",
      "",
      `Départ: ${departCity} (${departCountry})`,
      `Arrivée: ${destCity} (${destCountry})`,
      `Dates: ${departDate || "—"} → ${arriveDate || "—"}`,
      `Vol: ${flightNumber || "—"}`,
      `Poids dispo (kg): ${weightKg || "—"}`,
      `Contact: ${contactEmail || "—"}`,
    ].join("\n");
    try {
      const transporter = createSmtpTransporter();
      await transporter.sendMail({
        from: buildMailFrom(),
        to,
        subject: `[Voyage] ${departCity} → ${destCity}`,
        text,
        ...(contactEmail ? { replyTo: contactEmail } : {}),
      });
    } catch (mailErr) {
      console.warn("[public/trip-declaration] email non envoyé:", mailErr?.message || mailErr);
    }

    res.json({ ok: true });
  });
}

/**
 * Demande de partenariat point relais (formulaire multi-étapes) — SecurityEvent + documents privés + email équipe.
 */
function setupPublicPartnerRelayApplication(app) {
  app.post("/public/partner-relay-application", applicationBodyLimit, async (req, res) => {
    const prisma = getPrisma();
    try {
      const result = await submitApplication(prisma, {
        applicationType: APPLICATION_TYPES.RELAY,
        body: req.body || {},
        ip: req.ip || null,
        userAgent: (req.get("user-agent") || "").slice(0, 512) || null,
      });
      res.json(result);
    } catch (e) {
      if (e instanceof ApplicationError) {
        return res.status(e.statusCode).json({ error: e.message });
      }
      return res.status(500).json({ error: String(e.message || e) });
    }
  });
}

function sha256Hex(s) {
  return crypto.createHash("sha256").update(String(s), "utf8").digest("hex");
}

/** Demande « mot de passe oublié » — trace, jeton stocké (hash), email utilisateur si compte avec mot de passe. */
function setupPublicPasswordResetRequest(app) {
  app.post("/public/password-reset-request", strictRateLimit, async (req, res) => {
    const prisma = getPrisma();
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase().slice(0, 320) : "";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "email invalide." });
    }
    if (!prisma) {
      return res.status(503).json({ error: "Base indisponible." });
    }

    const recentResets = await countRecentSecurityEvents(prisma, {
      email,
      type: "password_reset_request",
    });
    if (recentResets >= RESET_CAPTCHA_THRESHOLD) {
      if (!(await requireTurnstile(req, res))) return;
    }

    try {
      await prisma.securityEvent.create({
        data: {
          type: "password_reset_request",
          email,
          ip: req.ip || null,
          userAgent: (req.get("user-agent") || "").slice(0, 512) || null,
          meta: { requestedAt: new Date().toISOString() },
        },
      });
    } catch (e) {
      return res.status(500).json({ error: String(e.message || e) });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true },
    });

    if (user?.passwordHash) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = sha256Hex(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      try {
        await prisma.passwordResetToken.updateMany({
          where: { userId: user.id, usedAt: null },
          data: { usedAt: new Date() },
        });
        await prisma.passwordResetToken.create({
          data: { userId: user.id, tokenHash, expiresAt },
        });
      } catch (e) {
        console.warn("[public/password-reset-request] token DB:", e?.message || e);
      }

      const base =
        (process.env.APP_PUBLIC_URL || process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
      const link = `${base}/mot-de-passe-oublie/nouveau?token=${rawToken}`;

      try {
        const tpl = passwordResetEmail({ resetLink: link });
        await sendMail({ to: email, ...tpl });
      } catch (mailErr) {
        console.warn("[public/password-reset-request] email utilisateur non envoyé:", mailErr?.message || mailErr);
      }
    }

    const to = process.env.CUSTOMERCARE_EMAIL || "customercare@lasolution.org";
    try {
      const transporter = createSmtpTransporter();
      await transporter.sendMail({
        from: buildMailFrom(),
        to,
        subject: `[Compte] Demande réinitialisation mot de passe`,
        text: `Demande de réinitialisation pour l’adresse ${email}.\n\n(Jeton généré uniquement si un compte avec mot de passe existe.)`,
        replyTo: email,
      });
    } catch (mailErr) {
      console.warn("[public/password-reset-request] email équipe non envoyé:", mailErr?.message || mailErr);
    }
    res.json({ ok: true });
  });
}

function setupPublicPasswordResetComplete(app) {
  app.post("/public/password-reset-complete", strictRateLimit, async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) {
      return res.status(503).json({ error: "Base indisponible." });
    }
    const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
    const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
    if (token.length < 32) {
      return res.status(400).json({ error: "Lien invalide." });
    }
    const policy = await validatePasswordPolicy(newPassword);
    if (!policy.ok) {
      return res.status(400).json({ error: policy.error });
    }
    const tokenHash = sha256Hex(token);
    const now = new Date();
    let row;
    try {
      row = await prisma.passwordResetToken.findFirst({
        where: { tokenHash, usedAt: null, expiresAt: { gt: now } },
        include: { user: { select: { id: true } } },
      });
    } catch (e) {
      return res.status(500).json({ error: String(e.message || e) });
    }
    if (!row) {
      return res.status(400).json({ error: "Lien invalide ou expiré. Demandez une nouvelle réinitialisation." });
    }
    let newHash;
    try {
      newHash = await hashPassword(newPassword);
    } catch (e) {
      return res.status(500).json({ error: String(e.message || e) });
    }
    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id: row.userId }, data: { passwordHash: newHash } });
        await tx.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: now } });
        await tx.passwordResetToken.updateMany({
          where: { userId: row.userId, usedAt: null, id: { not: row.id } },
          data: { usedAt: now },
        });
      });
      await revokeAllUserRefreshTokens(prisma, row.userId);
      await prisma.securityEvent.create({
        data: {
          type: "password_reset_complete",
          userId: row.userId,
          ip: req.ip || null,
          userAgent: (req.get("user-agent") || "").slice(0, 512) || null,
        },
      });
    } catch (e) {
      return res.status(500).json({ error: String(e.message || e) });
    }
    res.json({ ok: true });
  });
}

/** Rapports SoluPacker (réception / récupération) — hors workflow mission complet. */
function setupPublicMissionSolupackerReport(app) {
  app.post("/public/mission-solupacker-report", async (req, res) => {
    const prisma = getPrisma();
    const body = req.body || {};
    const missionId = typeof body.missionId === "string" ? body.missionId.trim().slice(0, 80) : "";
    const type = body.type === "reception" || body.type === "recuperation" ? body.type : null;
    const payload = body.payload && typeof body.payload === "object" && !Array.isArray(body.payload) ? body.payload : {};
    if (!missionId || !type) {
      return res.status(400).json({ error: "missionId et type (reception|recuperation) requis." });
    }
    if (!prisma) {
      return res.status(503).json({ error: "Base indisponible." });
    }
    const meta = { missionId, ...JSON.parse(JSON.stringify(payload)) };
    if (JSON.stringify(meta).length > 20000) {
      return res.status(400).json({ error: "Données trop volumineuses." });
    }
    try {
      await prisma.securityEvent.create({
        data: {
          type: type === "reception" ? "mission_reception_report" : "mission_recuperation_report",
          email: null,
          ip: req.ip || null,
          userAgent: (req.get("user-agent") || "").slice(0, 512) || null,
          meta,
        },
      });
    } catch (e) {
      return res.status(500).json({ error: String(e.message || e) });
    }
    const to = process.env.CUSTOMERCARE_EMAIL || "customercare@lasolution.org";
    const label = type === "reception" ? "Réception colis" : "Récupération colis";
    try {
      const transporter = createSmtpTransporter();
      await transporter.sendMail({
        from: buildMailFrom(),
        to,
        subject: `[Mission] ${label} — ${missionId}`,
        text: [`${label}`, `Mission: ${missionId}`, "", JSON.stringify(meta, null, 2)].join("\n"),
      });
    } catch (mailErr) {
      console.warn("[public/mission-solupacker-report] email non envoyé:", mailErr?.message || mailErr);
    }
    res.json({ ok: true });
  });
}

/** Annulation commande par le client. */
function setupOrderCancelRoute(app) {
  app.post("/orders/:id/cancel", requireAuth, async (req, res) => {
    if (!["admin", "client"].includes(req.auth.role)) {
      return res.status(403).json({ error: "Accès refusé." });
    }
    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      select: { id: true, userId: true, status: true },
    });
    if (!order) return res.status(404).json({ error: "Commande introuvable." });
    if (req.auth.role !== "admin" && order.userId !== req.auth.sub) {
      return res.status(403).json({ error: "Accès refusé." });
    }
    if (["CANCELLED", "DELIVERED"].includes(String(order.status).toUpperCase())) {
      return res.status(409).json({ error: "Cette commande ne peut plus être annulée." });
    }
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });
    try {
      await prisma.auditLog.create({
        data: {
          actorId: req.auth.sub,
          action: "order.cancelled",
          entityType: "Order",
          entityId: order.id,
          before: { status: order.status },
          after: { status: "CANCELLED" },
        },
      });
    } catch (_) {}
    res.json({ ok: true, orderId: updated.id, status: updated.status });
  });
}

/** Liste utilisateurs + stats pour l'admin. */
function setupAdminUsersRoute(app) {
  const guard = [requireAuth, requireRoles("admin")];

  app.get("/admin/users/stats", ...guard, async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });
    try {
      const grouped = await prisma.user.groupBy({ by: ["role"], _count: { _all: true } });
      const byRole = {};
      for (const g of grouped) byRole[g.role] = g._count._all;
      const total = Object.values(byRole).reduce((s, n) => s + n, 0);
      res.json({ total, byRole });
    } catch (e) {
      res.status(500).json({ error: String(e.message || e) });
    }
  });

  app.get("/admin/users", ...guard, async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize || "25", 10)));
    const skip = (page - 1) * pageSize;
    const role = typeof req.query.role === "string" && req.query.role ? req.query.role : undefined;
    const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 120) : "";

    const where = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    try {
      const [total, rows] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" },
          select: { id: true, email: true, name: true, role: true, createdAt: true, profile: true },
        }),
      ]);
      res.json({ data: rows, pagination: { page, pageSize, total } });
    } catch (e) {
      res.status(500).json({ error: String(e.message || e) });
    }
  });
}

/** Applications point relais + solupacker (SecurityEvent). */
function setupAdminApplicationsRoute(app) {
  const guard = [requireAuth, requireRoles("admin")];

  app.get("/admin/applications", ...guard, async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize || "25", 10)));
    const skip = (page - 1) * pageSize;
    const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 120) : "";
    const appType = typeof req.query.type === "string" ? req.query.type : "";

    const typeFilter = ALL_APPLICATION_TYPES.includes(appType) ? [appType] : ALL_APPLICATION_TYPES;

    const where = { type: { in: typeFilter } };
    if (search) {
      where.AND = [
        { type: { in: typeFilter } },
        { OR: [{ email: { contains: search, mode: "insensitive" } }] },
      ];
      delete where.type;
    }

    try {
      const [total, rows] = await Promise.all([
        prisma.securityEvent.count({ where }),
        prisma.securityEvent.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" },
          select: { id: true, type: true, email: true, meta: true, createdAt: true },
        }),
      ]);
      res.json({ data: rows, pagination: { page, pageSize, total } });
    } catch (e) {
      res.status(500).json({ error: String(e.message || e) });
    }
  });

  app.patch("/admin/applications/:id/accept", ...guard, async (req, res) => {
    const prisma = getPrisma();
    try {
      const result = await acceptApplication(prisma, {
        applicationId: req.params.id,
        adminId: req.auth.sub,
        ip: req.ip || null,
      });
      res.json(result);
    } catch (e) {
      if (e instanceof ApplicationError) {
        return res.status(e.statusCode).json({ error: e.message });
      }
      return res.status(500).json({ error: String(e.message || e) });
    }
  });

  app.patch("/admin/applications/:id/refuse", ...guard, async (req, res) => {
    const prisma = getPrisma();
    const reason = typeof req.body?.reason === "string" ? req.body.reason : "";
    try {
      const result = await refuseApplication(prisma, {
        applicationId: req.params.id,
        adminId: req.auth.sub,
        reason,
        ip: req.ip || null,
      });
      res.json(result);
    } catch (e) {
      if (e instanceof ApplicationError) {
        return res.status(e.statusCode).json({ error: e.message });
      }
      return res.status(500).json({ error: String(e.message || e) });
    }
  });

  app.get("/admin/applications/:id/document/:type", ...guard, async (req, res) => {
    const prisma = getPrisma();
    try {
      const { buf, mime, docType } = await getApplicationDocument(prisma, {
        applicationId: req.params.id,
        docType: req.params.type,
        adminId: req.auth.sub,
      });
      res.setHeader("Content-Type", mime);
      res.setHeader("Content-Disposition", `inline; filename="${docType}"`);
      res.setHeader("Cache-Control", "no-store");
      res.send(buf);
    } catch (e) {
      if (e instanceof ApplicationError) {
        return res.status(e.statusCode).json({ error: e.message });
      }
      return res.status(500).json({ error: String(e.message || e) });
    }
  });
}

/** Demande solupacker (formulaire multi-étapes) — SecurityEvent + documents privés + email équipe. */
function setupPublicSolupackerApplication(app) {
  app.post("/public/solupacker-application", applicationBodyLimit, async (req, res) => {
    const prisma = getPrisma();
    try {
      const result = await submitApplication(prisma, {
        applicationType: APPLICATION_TYPES.SOLUPACKER,
        body: req.body || {},
        ip: req.ip || null,
        userAgent: (req.get("user-agent") || "").slice(0, 512) || null,
      });
      res.json(result);
    } catch (e) {
      if (e instanceof ApplicationError) {
        return res.status(e.statusCode).json({ error: e.message });
      }
      return res.status(500).json({ error: String(e.message || e) });
    }
  });
}

function setupAdminStatsRoute(app) {
  const guard = [requireAuth, requireRoles("admin")];

  app.get("/admin/stats", ...guard, async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    try {
      const [
        totalOrders,
        ordersByStatus,
        totalClients,
        totalSolupackers,
        totalRelais,
        revenueAgg,
        pendingTestimonials,
      ] = await Promise.all([
        prisma.order.count(),
        prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.user.count({ where: { role: "client" } }),
        prisma.user.count({ where: { role: "solupacker" } }),
        prisma.user.count({ where: { role: "relais" } }),
        prisma.orderLine.aggregate({
          _sum: { unitPrice: true },
          where: {
            order: { status: { in: ["PAID", "DELIVERED"] } },
          },
        }),
        prisma.orderTestimonial.count({ where: { status: "PENDING" } }),
      ]);

      const byStatus = {};
      for (const g of ordersByStatus) {
        byStatus[g.status] = g._count._all;
      }

      const revenue = Number(revenueAgg._sum.unitPrice ?? 0);

      res.json({
        revenue,
        totalOrders,
        byStatus,
        totalClients,
        totalSolupackers,
        totalRelais,
        pendingTestimonials,
      });
    } catch (e) {
      res.status(500).json({ error: String(e.message || e) });
    }
  });
}

function setupRoutes(app, config) {
  setupAuthRoutes(app, getPrisma, config);
  setupMfaRoutes(app, getPrisma);
  setupOrderParcelRoutes(app, getPrisma);
  setupTestimonialRoutes(app, getPrisma);
  setupMissionRoutes(app, getPrisma);
  setupShippingRequestRoutes(app, getPrisma);
  setupAdminShippingRequestRoutes(app, getPrisma);
  setupPartnerOpsRoutes(app);
  setupAdminStatsRoute(app);
  setupAdminUsersRoute(app);
  setupAdminApplicationsRoute(app);
  setupOrderCancelRoute(app);
  setupPublicContactRoute(app);
  setupPublicComingSoonWaitlistRoute(app);
  setupPublicComingSoonNewsletterRoute(app);
  setupPublicTripDeclaration(app);
  setupPublicPartnerRelayApplication(app);
  setupPublicSolupackerApplication(app);
  setupPublicPasswordResetRequest(app);
  setupPublicPasswordResetComplete(app);
  setupPublicMissionSolupackerReport(app);
  setupPaymentRoutes(app);
  setupWebhookRoutes(app);
  setupBillingStubRoutes(app);
  setupCarrierRoutes(app);
}

module.exports = { setupRoutes };
