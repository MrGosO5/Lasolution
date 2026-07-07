const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const INSECURE_SECRETS = new Set([
  "dev-insecure-change-me",
  "dev-secret-change-en-production",
]);

function getSecret() {
  const secret = process.env.API_JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (secret) {
    if (process.env.NODE_ENV === "production" && INSECURE_SECRETS.has(secret)) {
      throw new Error("API_JWT_SECRET utilise une valeur par défaut non sécurisée en production.");
    }
    return secret;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("API_JWT_SECRET est obligatoire en production.");
  }
  return "dev-insecure-change-me";
}

function accessTtl() {
  return process.env.JWT_ACCESS_TTL || "15m";
}

function refreshTtlMs() {
  const d = parseInt(process.env.JWT_REFRESH_DAYS || "7", 10);
  return d * 24 * 60 * 60 * 1000;
}

function signAccessToken(user) {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name || user.email,
  };
  return jwt.sign(payload, getSecret(), { expiresIn: accessTtl() });
}

function verifyAccessToken(token) {
  const secrets = [getSecret()];
  const prev = process.env.API_JWT_SECRET_PREVIOUS;
  if (prev && !INSECURE_SECRETS.has(prev)) secrets.push(prev);
  let lastErr;
  for (const secret of secrets) {
    try {
      return jwt.verify(token, secret);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("Jeton invalide.");
}

function hashRefresh(raw) {
  return crypto.createHash("sha256").update(raw, "utf8").digest("hex");
}

async function issueRefreshToken(prisma, userId, meta = {}) {
  const raw = crypto.randomBytes(48).toString("base64url");
  const tokenHash = hashRefresh(raw);
  const expiresAt = new Date(Date.now() + refreshTtlMs());
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      userAgent: meta.userAgent ? String(meta.userAgent).slice(0, 512) : null,
      ip: meta.ip ? String(meta.ip).slice(0, 64) : null,
      lastUsedAt: new Date(),
    },
  });
  return raw;
}

async function revokeRefreshToken(prisma, plainRefresh) {
  if (!plainRefresh) return false;
  const tokenHash = hashRefresh(plainRefresh);
  const result = await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return result.count > 0;
}

async function revokeAllUserRefreshTokens(prisma, userId, exceptTokenHash = null) {
  const where = { userId, revokedAt: null };
  if (exceptTokenHash) {
    where.tokenHash = { not: exceptTokenHash };
  }
  await prisma.refreshToken.updateMany({
    where,
    data: { revokedAt: new Date() },
  });
}

async function consumeAndRotateRefresh(prisma, plainRefresh, meta = {}) {
  const tokenHash = hashRefresh(plainRefresh);
  const row = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!row || row.revokedAt || row.expiresAt < new Date()) {
    return null;
  }
  await prisma.refreshToken.update({
    where: { id: row.id },
    data: {
      revokedAt: new Date(),
      lastUsedAt: new Date(),
      ...(meta.ip && { ip: String(meta.ip).slice(0, 64) }),
      ...(meta.userAgent && { userAgent: String(meta.userAgent).slice(0, 512) }),
    },
  });
  const user = await prisma.user.findUnique({ where: { id: row.userId } });
  if (!user) return null;
  const newRefresh = await issueRefreshToken(prisma, user.id, meta);
  const accessToken = signAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });
  return {
    accessToken,
    refreshToken: newRefresh,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name || user.email,
    },
  };
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  issueRefreshToken,
  consumeAndRotateRefresh,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
  hashRefresh,
};
