const crypto = require("crypto");
const { resolveUserFromCredentials, ensureUserInDb } = require("../auth/resolveUser");
const { signAccessToken, issueRefreshToken, consumeAndRotateRefresh } = require("../auth/tokens");
const { hashPassword, verifyPassword } = require("../auth/password");
const { loginRateLimit, strictRateLimit } = require("../middleware/auth");
const { sendMail } = require("../emails/mailer");
const { welcomeEmail } = require("../emails/templates");

function setupAuthRoutes(app, getPrisma, config) {
  app.post("/auth/register", strictRateLimit, async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) {
      return res.status(503).json({ error: "Base de données indisponible." });
    }
    const body = req.body || {};
    const lastName = typeof body.lastName === "string" ? body.lastName.trim().slice(0, 120) : "";
    const firstName = typeof body.firstName === "string" ? body.firstName.trim().slice(0, 120) : "";
    const emailRaw = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const country = typeof body.country === "string" ? body.country.trim().slice(0, 80) : "";
    const password = typeof body.password === "string" ? body.password : "";
    const acceptTerms = body.acceptTerms === true || body.acceptTerms === "true";

    if (!firstName || !lastName) {
      return res.status(400).json({ error: "Nom et prénom requis." });
    }
    if (!emailRaw || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
      return res.status(400).json({ error: "Email invalide." });
    }
    if (!country) {
      return res.status(400).json({ error: "Pays requis." });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caractères." });
    }
    if (!acceptTerms) {
      return res.status(400).json({ error: "Vous devez accepter les conditions." });
    }

    const existing = await prisma.user.findUnique({ where: { email: emailRaw } });
    if (existing) {
      return res.status(409).json({ error: "Un compte existe déjà avec cet email." });
    }

    const id = crypto.randomUUID();
    const name = `${firstName} ${lastName}`.trim();
    let passwordHash;
    try {
      passwordHash = hashPassword(password);
    } catch (e) {
      return res.status(500).json({ error: String(e.message || e) });
    }

    try {
      await prisma.user.create({
        data: {
          id,
          email: emailRaw,
          name,
          role: "client",
          passwordHash,
        },
      });
      await prisma.securityEvent.create({
        data: {
          type: "register_ok",
          userId: id,
          email: emailRaw,
          ip: req.ip || null,
          userAgent: (req.get("user-agent") || "").slice(0, 512) || null,
          meta: { country },
        },
      });
    } catch (e) {
      if (e.code === "P2002") {
        return res.status(409).json({ error: "Un compte existe déjà avec cet email." });
      }
      return res.status(500).json({ error: String(e.message || e) });
    }

    // Email de bienvenue (non bloquant)
    const tpl = welcomeEmail({ name });
    sendMail({ to: emailRaw, ...tpl });

    return res.status(201).json({ ok: true, id, email: emailRaw, name, role: "client" });
  });

  app.post("/auth/login", loginRateLimit, async (req, res) => {
    const { email, password } = req.body || {};
    const prisma = getPrisma();
    const ip = req.ip || req.socket?.remoteAddress;
    const userAgent = req.headers["user-agent"];

    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis." });
    }

    let user = resolveUserFromCredentials(email, password, config);

    if (!user && prisma) {
      const em = String(email).trim().toLowerCase();
      try {
        const row = await prisma.user.findUnique({ where: { email: em } });
        if (row?.passwordHash && verifyPassword(password, row.passwordHash)) {
          user = {
            id: row.id,
            email: row.email,
            role: row.role,
            name: row.name || row.email,
          };
        }
      } catch (_) {
        /* ignore */
      }
    }

    if (!user) {
      if (prisma) {
        try {
          await prisma.securityEvent.create({
            data: {
              type: "login_fail",
              email: String(email).trim(),
              ip,
              userAgent,
            },
          });
        } catch (_) {
          /* ignore */
        }
      }
      return res.status(401).json({ error: "Identifiants invalides." });
    }

    let dbReady = false;
    try {
      await ensureUserInDb(prisma, user);
      if (prisma) {
        await prisma.securityEvent.create({
          data: {
            type: "login_ok",
            userId: user.id,
            email: user.email,
            ip,
            userAgent,
          },
        });
        dbReady = true;
      }
    } catch (e) {
      console.warn("[auth/login] PostgreSQL indisponible ou erreur persistance — session sans jetons API:", e.message);
    }

    let accessToken = null;
    let refreshToken = null;
    if (dbReady && prisma) {
      try {
        accessToken = signAccessToken(user);
        refreshToken = await issueRefreshToken(prisma, user.id);
      } catch (e) {
        console.warn("[auth/login] Émission refresh impossible:", e.message);
        try {
          accessToken = signAccessToken(user);
        } catch (_) {
          /* ignore */
        }
      }
    } else if (!dbReady) {
      try {
        accessToken = signAccessToken(user);
      } catch (_) {
        /* pas de JWT si secret invalide */
      }
    }

    return res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      ...(accessToken && { accessToken, ...(refreshToken && { refreshToken }) }),
      ...(!dbReady && { authDegraded: true }),
    });
  });

  app.post("/auth/refresh", async (req, res) => {
    const prisma = getPrisma();
    const { refreshToken: plain } = req.body || {};
    if (!prisma) {
      return res.status(503).json({ error: "Base de données indisponible." });
    }
    if (!plain || typeof plain !== "string") {
      return res.status(400).json({ error: "refreshToken requis." });
    }
    const out = await consumeAndRotateRefresh(prisma, plain);
    if (!out) {
      return res.status(401).json({ error: "Refresh token invalide ou expiré." });
    }
    return res.json({
      accessToken: out.accessToken,
      refreshToken: out.refreshToken,
      user: out.user,
    });
  });
}

module.exports = { setupAuthRoutes };
