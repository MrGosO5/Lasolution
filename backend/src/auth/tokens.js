const crypto = require("crypto");
const jwt = require("jsonwebtoken");

function getSecret() {
  return process.env.API_JWT_SECRET || process.env.NEXTAUTH_SECRET || "dev-insecure-change-me";
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
  return jwt.verify(token, getSecret());
}

function hashRefresh(raw) {
  return crypto.createHash("sha256").update(raw, "utf8").digest("hex");
}

async function issueRefreshToken(prisma, userId) {
  const raw = crypto.randomBytes(48).toString("base64url");
  const tokenHash = hashRefresh(raw);
  const expiresAt = new Date(Date.now() + refreshTtlMs());
  await prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt },
  });
  return raw;
}

async function consumeAndRotateRefresh(prisma, plainRefresh) {
  const tokenHash = hashRefresh(plainRefresh);
  const row = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!row || row.revokedAt || row.expiresAt < new Date()) {
    return null;
  }
  await prisma.refreshToken.update({
    where: { id: row.id },
    data: { revokedAt: new Date() },
  });
  const user = await prisma.user.findUnique({ where: { id: row.userId } });
  if (!user) return null;
  const newRefresh = await issueRefreshToken(prisma, user.id);
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
};
