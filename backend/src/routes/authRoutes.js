const crypto = require("crypto");
const { resolveUserFromCredentials, ensureUserInDb, isEnvFallbackEnabled } = require("../auth/resolveUser");
const {
  signAccessToken,
  issueRefreshToken,
  consumeAndRotateRefresh,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
  hashRefresh,
} = require("../auth/tokens");
const { hashPassword, verifyPassword, needsRehash } = require("../auth/password");
const { validatePasswordPolicy } = require("../auth/passwordPolicy");
const {
  loginEmailRateLimit,
  strictRateLimit,
  refreshRateLimit,
  requireAuth,
  normalizeEmail,
} = require("../middleware/auth");
const { requireTurnstile, isTurnstileConfigured } = require("../middleware/turnstile");
const { sendMail } = require("../emails/mailer");
const { welcomeEmail, emailVerificationEmail } = require("../emails/templates");
const { reconcileDemoClientAccount } = require("../auth/normalizeClientAuth");
const { verifyLoginTotp } = require("./mfaRoutes");

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_MINUTES = 15;
const LOGIN_FAIL_CAPTCHA_THRESHOLD = 3;
const RESET_CAPTCHA_THRESHOLD = 2;

function sha256Hex(s) {
  return crypto.createHash("sha256").update(String(s), "utf8").digest("hex");
}

function publicBaseUrl() {
  return (process.env.APP_PUBLIC_URL || process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
}

async function countRecentSecurityEvents(prisma, { email, type, minutes = 15 }) {
  const since = new Date(Date.now() - minutes * 60 * 1000);
  return prisma.securityEvent.count({
    where: {
      email: normalizeEmail(email),
      type,
      createdAt: { gte: since },
    },
  });
}

async function issueEmailVerification(prisma, userId, email, name) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256Hex(rawToken);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.emailVerificationToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });
  await prisma.emailVerificationToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  const link = `${publicBaseUrl()}/verifier-email?token=${rawToken}`;
  const tpl = emailVerificationEmail({ name: name || email, verifyLink: link });
  sendMail({ to: email, ...tpl }).catch((e) => {
    console.warn("[auth] email vérification non envoyé:", e?.message || e);
  });
}

function setupAuthRoutes(app, getPrisma, config) {
  app.post("/auth/register", strictRateLimit, async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) {
      return res.status(503).json({ error: "Base de données indisponible." });
    }

    if (!(await requireTurnstile(req, res))) return;

    const body = req.body || {};
    const lastName = typeof body.lastName === "string" ? body.lastName.trim().slice(0, 120) : "";
    const firstName = typeof body.firstName === "string" ? body.firstName.trim().slice(0, 120) : "";
    const emailRaw = normalizeEmail(body.email);
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
    if (!acceptTerms) {
      return res.status(400).json({ error: "Vous devez accepter les conditions." });
    }

    const policy = await validatePasswordPolicy(password);
    if (!policy.ok) {
      return res.status(400).json({ error: policy.error });
    }

    const existing = await prisma.user.findUnique({ where: { email: emailRaw } });
    if (existing) {
      return res.status(409).json({ error: "Un compte existe déjà avec cet email." });
    }

    const id = crypto.randomUUID();
    const name = `${firstName} ${lastName}`.trim();
    let passwordHash;
    try {
      passwordHash = await hashPassword(password);
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
      await issueEmailVerification(prisma, id, emailRaw, name);
    } catch (e) {
      if (e.code === "P2002") {
        return res.status(409).json({ error: "Un compte existe déjà avec cet email." });
      }
      return res.status(500).json({ error: String(e.message || e) });
    }

    const tpl = welcomeEmail({ name });
    sendMail({ to: emailRaw, ...tpl });

    return res.status(201).json({ ok: true, id, email: emailRaw, name, role: "client", emailVerificationSent: true });
  });

  app.post("/auth/login", loginEmailRateLimit, async (req, res) => {
    const { email, password, totpCode, captchaToken } = req.body || {};
    const prisma = getPrisma();
    const ip = req.ip || req.socket?.remoteAddress;
    const userAgent = req.headers["user-agent"];
    const em = normalizeEmail(email);

    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis." });
    }

    if (prisma && isTurnstileConfigured()) {
      const failCount = await countRecentSecurityEvents(prisma, { email: em, type: "login_fail" });
      if (failCount >= LOGIN_FAIL_CAPTCHA_THRESHOLD) {
        req.body.captchaToken = captchaToken;
        if (!(await requireTurnstile(req, res))) return;
      }
    }

    let user = null;
    let dbRow = null;

    if (prisma) {
      try {
        dbRow = await prisma.user.findUnique({
          where: { email: em },
          select: {
            id: true,
            email: true,
            role: true,
            name: true,
            passwordHash: true,
            failedLoginCount: true,
            lockedUntil: true,
            totpSecret: true,
            mfaEnabled: true,
          },
        });
        if (dbRow?.lockedUntil && dbRow.lockedUntil > new Date()) {
          return res.status(429).json({
            error: "Compte temporairement verrouillé après plusieurs tentatives. Réessayez plus tard.",
            code: "ACCOUNT_LOCKED",
          });
        }
        if (dbRow?.passwordHash && (await verifyPassword(password, dbRow.passwordHash))) {
          const mfa = verifyLoginTotp(dbRow, totpCode);
          if (!mfa.ok) {
            return res.status(401).json({ error: mfa.error, code: mfa.code });
          }
          user = {
            id: dbRow.id,
            email: dbRow.email,
            role: dbRow.role,
            name: dbRow.name || dbRow.email,
          };
        }
      } catch (_) {
        /* ignore */
      }
    }

    if (!user && isEnvFallbackEnabled()) {
      user = resolveUserFromCredentials(email, password, config);
    }

    if (!user) {
      if (prisma && dbRow) {
        try {
          const failedLoginCount = (dbRow.failedLoginCount || 0) + 1;
          const update = { failedLoginCount };
          if (failedLoginCount >= LOCKOUT_THRESHOLD) {
            update.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
            await prisma.securityEvent.create({
              data: {
                type: "account_locked",
                userId: dbRow.id,
                email: em,
                ip,
                userAgent,
                meta: { failedLoginCount },
              },
            });
          }
          await prisma.user.update({ where: { id: dbRow.id }, data: update });
        } catch (_) {
          /* ignore */
        }
      }
      if (prisma) {
        try {
          await prisma.securityEvent.create({
            data: {
              type: "login_fail",
              email: em,
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

    user = await reconcileDemoClientAccount(prisma, user);

    let dbReady = false;
    try {
      await ensureUserInDb(prisma, user);
      if (prisma && dbRow) {
        const updates = { failedLoginCount: 0, lockedUntil: null };
        if (needsRehash(dbRow.passwordHash)) {
          updates.passwordHash = await hashPassword(password);
        }
        await prisma.user.update({ where: { id: dbRow.id }, data: updates });
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
      } else if (prisma) {
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
      console.warn("[auth/login] PostgreSQL indisponible ou erreur persistance:", e.message);
    }

    const meta = { ip, userAgent };
    let accessToken = null;
    let refreshToken = null;
    if (dbReady && prisma) {
      try {
        accessToken = signAccessToken(user);
        refreshToken = await issueRefreshToken(prisma, user.id, meta);
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
        /* ignore */
      }
    }

    const requiresCaptcha =
      prisma && (await countRecentSecurityEvents(prisma, { email: em, type: "login_fail" })) >= LOGIN_FAIL_CAPTCHA_THRESHOLD;

    return res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      ...(accessToken && { accessToken, ...(refreshToken && { refreshToken }) }),
      ...(!dbReady && { authDegraded: true }),
      ...(requiresCaptcha && { requiresCaptcha: true }),
    });
  });

  app.post("/auth/logout", refreshRateLimit, async (req, res) => {
    const prisma = getPrisma();
    const { refreshToken: plain } = req.body || {};
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });
    if (!plain || typeof plain !== "string") {
      return res.status(400).json({ error: "refreshToken requis." });
    }

    const tokenHash = hashRefresh(plain);
    const row = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, email: true } } },
    });

    await revokeRefreshToken(prisma, plain);

    if (row?.user) {
      try {
        await prisma.securityEvent.create({
          data: {
            type: "logout",
            userId: row.user.id,
            email: row.user.email,
            ip: req.ip || null,
            userAgent: (req.get("user-agent") || "").slice(0, 512) || null,
          },
        });
      } catch (_) {
        /* ignore */
      }
    }

    return res.json({ ok: true });
  });

  app.post("/auth/refresh", refreshRateLimit, async (req, res) => {
    const prisma = getPrisma();
    const { refreshToken: plain } = req.body || {};
    if (!prisma) {
      return res.status(503).json({ error: "Base de données indisponible." });
    }
    if (!plain || typeof plain !== "string") {
      return res.status(400).json({ error: "refreshToken requis." });
    }
    const meta = {
      ip: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers["user-agent"],
    };
    const out = await consumeAndRotateRefresh(prisma, plain, meta);
    if (!out) {
      return res.status(401).json({ error: "Refresh token invalide ou expiré." });
    }
    return res.json({
      accessToken: out.accessToken,
      refreshToken: out.refreshToken,
      user: out.user,
    });
  });

  app.get("/auth/sessions", requireAuth, async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    const sessions = await prisma.refreshToken.findMany({
      where: { userId: req.auth.sub, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastUsedAt: "desc" },
      select: {
        id: true,
        userAgent: true,
        ip: true,
        lastUsedAt: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    res.json({ sessions });
  });

  app.delete("/auth/sessions/:id", requireAuth, async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    const row = await prisma.refreshToken.findFirst({
      where: { id: req.params.id, userId: req.auth.sub, revokedAt: null },
    });
    if (!row) return res.status(404).json({ error: "Session introuvable." });

    await prisma.refreshToken.update({
      where: { id: row.id },
      data: { revokedAt: new Date() },
    });
    res.json({ ok: true });
  });

  app.delete("/auth/sessions", requireAuth, async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    const currentPlain = req.body?.refreshToken;
    const exceptHash = currentPlain ? hashRefresh(currentPlain) : null;
    await revokeAllUserRefreshTokens(prisma, req.auth.sub, exceptHash);
    res.json({ ok: true });
  });

  app.post("/public/verify-email", strictRateLimit, async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
    if (token.length < 32) {
      return res.status(400).json({ error: "Lien de vérification invalide." });
    }

    const tokenHash = sha256Hex(token);
    const now = new Date();
    const row = await prisma.emailVerificationToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: now } },
      include: { user: { select: { id: true } } },
    });
    if (!row) {
      return res.status(400).json({ error: "Lien invalide ou expiré." });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: row.userId },
        data: { emailVerifiedAt: now },
      }),
      prisma.emailVerificationToken.update({
        where: { id: row.id },
        data: { usedAt: now },
      }),
      prisma.emailVerificationToken.updateMany({
        where: { userId: row.userId, usedAt: null, id: { not: row.id } },
        data: { usedAt: now },
      }),
    ]);

    res.json({ ok: true });
  });

  app.post("/public/resend-verification", strictRateLimit, async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    const email = normalizeEmail(req.body?.email);
    if (!email) return res.status(400).json({ error: "Email requis." });

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, emailVerifiedAt: true },
    });

    if (user && !user.emailVerifiedAt) {
      await issueEmailVerification(prisma, user.id, user.email, user.name);
    }

    res.json({ ok: true });
  });

  /** Liaison compte OAuth (Google/Apple) — appel interne depuis NextAuth. */
  app.post("/auth/oauth/sync", strictRateLimit, async (req, res) => {
    const internalSecret = process.env.OAUTH_INTERNAL_SECRET;
    const provided = req.headers["x-oauth-internal-secret"];
    if (!internalSecret || provided !== internalSecret) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    const provider = String(req.body?.provider || "").trim();
    const providerAccountId = String(req.body?.providerAccountId || "").trim();
    const email = normalizeEmail(req.body?.email);
    const name = typeof req.body?.name === "string" ? req.body.name.trim().slice(0, 200) : email;

    if (!provider || !providerAccountId || !email) {
      return res.status(400).json({ error: "provider, providerAccountId et email requis." });
    }

    let oauth = await prisma.oAuthAccount.findUnique({
      where: { provider_providerAccountId: { provider, providerAccountId } },
      include: { user: true },
    });

    if (oauth) {
      const accessToken = signAccessToken({
        id: oauth.user.id,
        email: oauth.user.email,
        role: oauth.user.role,
        name: oauth.user.name || oauth.user.email,
      });
      const refreshToken = await issueRefreshToken(prisma, oauth.user.id, {
        ip: req.ip,
        userAgent: req.get("user-agent"),
      });
      return res.json({
        id: oauth.user.id,
        email: oauth.user.email,
        role: oauth.user.role,
        name: oauth.user.name || oauth.user.email,
        accessToken,
        refreshToken,
      });
    }

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          email,
          name,
          role: "client",
          emailVerifiedAt: new Date(),
        },
      });
    }

    await prisma.oAuthAccount.create({
      data: { userId: user.id, provider, providerAccountId },
    });

    const accessToken = signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name || user.email,
    });
    const refreshToken = await issueRefreshToken(prisma, user.id, {
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name || user.email,
      accessToken,
      refreshToken,
    });
  });
}

module.exports = {
  setupAuthRoutes,
  issueEmailVerification,
  sha256Hex,
  RESET_CAPTCHA_THRESHOLD,
  countRecentSecurityEvents,
};
