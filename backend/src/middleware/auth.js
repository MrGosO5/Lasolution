const { verifyAccessToken } = require("../auth/tokens");
const { normalizeAuthPayload } = require("../auth/normalizeClientAuth");
const { getRedis } = require("../redis");

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX = 10;
const LOGIN_EMAIL_MAX = 5;
const STRICT_MAX = 5;
const REFRESH_MAX = 30;

const memBuckets = new Map();

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase()
    .slice(0, 320) || "unknown";
}

async function incrementBucket(key, max, windowMs) {
  const redis = getRedis();
  if (redis) {
    try {
      const n = await redis.incr(key);
      if (n === 1) await redis.expire(key, Math.floor(windowMs / 1000));
      return n <= max;
    } catch (e) {
      console.warn("[redis] rate limit fallback mémoire:", e.message);
    }
  }

  const now = Date.now();
  let bucket = memBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    memBuckets.set(key, bucket);
  }
  bucket.count += 1;
  return bucket.count <= max;
}

function makeRateLimit(prefix, max, errorMsg, keyFn) {
  return function rateLimit(req, res, next) {
    void (async () => {
      const ip = req.ip || req.socket?.remoteAddress || "unknown";
      const suffix = keyFn ? keyFn(req) : ip;
      const key = `ratelimit:${prefix}:${suffix}`;
      const ok = await incrementBucket(key, max, LOGIN_WINDOW_MS);
      if (!ok) {
        res.status(429).json({ error: errorMsg });
        return;
      }
      next();
    })().catch(next);
  };
}

const loginRateLimit = makeRateLimit(
  "login",
  LOGIN_MAX,
  "Trop de tentatives de connexion. Réessayez plus tard.",
  (req) => req.ip || req.socket?.remoteAddress || "unknown"
);

function loginEmailRateLimit(req, res, next) {
  void (async () => {
    const email = normalizeEmail(req.body?.email);
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    const ipOk = await incrementBucket(`ratelimit:login:${ip}`, LOGIN_MAX, LOGIN_WINDOW_MS);
    if (!ipOk) {
      res.status(429).json({ error: "Trop de tentatives de connexion. Réessayez plus tard." });
      return;
    }
    const emailOk = await incrementBucket(`ratelimit:login-email:${email}`, LOGIN_EMAIL_MAX, LOGIN_WINDOW_MS);
    if (!emailOk) {
      res.status(429).json({
        error: "Trop de tentatives pour ce compte. Réessayez plus tard.",
        code: "LOGIN_EMAIL_RATE_LIMIT",
      });
      return;
    }
    next();
  })().catch(next);
}

const strictRateLimit = makeRateLimit(
  "strict",
  STRICT_MAX,
  "Trop de requêtes. Réessayez dans 15 minutes.",
  (req) => req.ip || req.socket?.remoteAddress || "unknown"
);

const refreshRateLimit = makeRateLimit(
  "refresh",
  REFRESH_MAX,
  "Trop de rafraîchissements de session. Réessayez plus tard.",
  (req) => req.ip || req.socket?.remoteAddress || "unknown"
);

function requireAuth(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentification requise.", code: "UNAUTHORIZED" });
  }
  const token = h.slice("Bearer ".length).trim();
  try {
    const payload = normalizeAuthPayload(verifyAccessToken(token));
    req.auth = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Jeton invalide ou expiré.", code: "INVALID_TOKEN" });
  }
}

function requireRoles(...allowed) {
  return (req, res, next) => {
    const role = req.auth?.role;
    if (!role || !allowed.includes(role)) {
      return res.status(403).json({ error: "Accès refusé.", code: "FORBIDDEN" });
    }
    next();
  };
}

function requireVerifiedEmail(getPrisma) {
  return async (req, res, next) => {
    if (req.auth?.role === "admin") return next();
    const prisma = getPrisma();
    if (!prisma) {
      return res.status(503).json({ error: "Base indisponible." });
    }
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.auth.sub },
        select: { emailVerifiedAt: true },
      });
      if (!user?.emailVerifiedAt) {
        return res.status(403).json({
          error: "Vérifiez votre adresse email avant de passer commande.",
          code: "EMAIL_NOT_VERIFIED",
        });
      }
      next();
    } catch (e) {
      return res.status(500).json({ error: String(e.message || e) });
    }
  };
}

module.exports = {
  loginRateLimit,
  loginEmailRateLimit,
  strictRateLimit,
  refreshRateLimit,
  requireAuth,
  requireRoles,
  requireVerifiedEmail,
  normalizeEmail,
};
