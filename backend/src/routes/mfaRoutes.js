const crypto = require("crypto");
const { authenticator } = require("otplib");
const QRCode = require("qrcode");
const { requireAuth } = require("../middleware/auth");

function mfaRequiredForRole(role) {
  const raw = process.env.MFA_REQUIRED_ROLES || "admin";
  const roles = raw.split(",").map((r) => r.trim()).filter(Boolean);
  return roles.includes(role);
}

function setupMfaRoutes(app, getPrisma) {
  app.post("/auth/mfa/setup", requireAuth, async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    const user = await prisma.user.findUnique({ where: { id: req.auth.sub } });
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable." });

    const secret = authenticator.generateSecret();
    const issuer = process.env.MFA_ISSUER || "La Solution";
    const otpauth = authenticator.keyuri(user.email, issuer, secret);

    await prisma.user.update({
      where: { id: user.id },
      data: { totpSecret: secret, mfaEnabled: false },
    });

    const qrDataUrl = await QRCode.toDataURL(otpauth);
    return res.json({ secret, qrDataUrl, otpauth });
  });

  app.post("/auth/mfa/verify", requireAuth, async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    const code = String(req.body?.code || "").trim();
    if (!code) return res.status(400).json({ error: "Code TOTP requis." });

    const user = await prisma.user.findUnique({ where: { id: req.auth.sub } });
    if (!user?.totpSecret) return res.status(400).json({ error: "MFA non initialisé." });

    const valid = authenticator.verify({ token: code, secret: user.totpSecret });
    if (!valid) return res.status(400).json({ error: "Code TOTP invalide." });

    await prisma.user.update({
      where: { id: user.id },
      data: { mfaEnabled: true },
    });

    return res.json({ ok: true });
  });

  app.post("/auth/mfa/disable", requireAuth, async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    const code = String(req.body?.code || "").trim();
    const user = await prisma.user.findUnique({ where: { id: req.auth.sub } });
    if (!user?.totpSecret) return res.status(400).json({ error: "MFA non activé." });

    if (!authenticator.verify({ token: code, secret: user.totpSecret })) {
      return res.status(400).json({ error: "Code TOTP invalide." });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { mfaEnabled: false, totpSecret: null },
    });

    return res.json({ ok: true });
  });
}

function verifyLoginTotp(user, totpCode) {
  if (!mfaRequiredForRole(user.role) || !user.mfaEnabled || !user.totpSecret) {
    return { ok: true };
  }
  const code = String(totpCode || "").trim();
  if (!code) {
    return { ok: false, error: "Code d'authentification à deux facteurs requis.", code: "MFA_REQUIRED" };
  }
  const valid = authenticator.verify({ token: code, secret: user.totpSecret });
  if (!valid) {
    return { ok: false, error: "Code d'authentification à deux facteurs invalide.", code: "MFA_INVALID" };
  }
  return { ok: true };
}

module.exports = { setupMfaRoutes, verifyLoginTotp, mfaRequiredForRole };
