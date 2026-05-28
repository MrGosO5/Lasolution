const { verifyAccessToken } = require("../auth/tokens");
const { normalizeAuthPayload } = require("../auth/normalizeClientAuth");
const { getRedis } = require("../redis");

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX = 10;       // 10 tentatives de login par IP par 15 min
const STRICT_MAX = 5;       // 5 tentatives (register, password-reset) par IP par 15 min

const memBuckets = new Map();

function makeRateLimit(prefix, max, errorMsg) {
  return function rateLimit(req, res, next) {
    void (async () => {
      const ip = req.ip || req.socket?.remoteAddress || "unknown";
      const redis = getRedis();
      if (redis) {
        try {
          const key = `ratelimit:${prefix}:${ip}`;
          const n = await redis.incr(key);
          if (n === 1) await redis.expire(key, Math.floor(LOGIN_WINDOW_MS / 1000));
          if (n > max) {
            res.status(429).json({ error: errorMsg });
            return;
          }
          next();
          return;
        } catch (e) {
          console.warn("[redis] rate limit fallback mémoire:", e.message);
        }
      }

      const now = Date.now();
      const mapKey = `${prefix}:${ip}`;
      let bucket = memBuckets.get(mapKey);
      if (!bucket || now > bucket.resetAt) {
        bucket = { count: 0, resetAt: now + LOGIN_WINDOW_MS };
        memBuckets.set(mapKey, bucket);
      }
      bucket.count += 1;
      if (bucket.count > max) {
        res.status(429).json({ error: errorMsg });
        return;
      }
      next();
    })().catch(next);
  };
}

const loginRateLimit = makeRateLimit("login", LOGIN_MAX, "Trop de tentatives de connexion. Réessayez plus tard.");
const strictRateLimit = makeRateLimit("strict", STRICT_MAX, "Trop de requêtes. Réessayez dans 15 minutes.");

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

module.exports = { loginRateLimit, strictRateLimit, requireAuth, requireRoles };
