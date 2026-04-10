const crypto = require("crypto");

const PBKDF2_ITER = 120000;
const KEYLEN = 64;
const DIGEST = "sha512";

function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(plain, salt, PBKDF2_ITER, KEYLEN, DIGEST).toString("hex");
  return `pbkdf2:${DIGEST}:${PBKDF2_ITER}:${salt}:${hash}`;
}

function verifyPassword(plain, stored) {
  if (!stored || typeof plain !== "string") return false;
  const parts = String(stored).split(":");
  if (parts[0] !== "pbkdf2" || parts.length !== 5) return false;
  const digest = parts[1];
  const iter = parseInt(parts[2], 10);
  const salt = parts[3];
  const expected = parts[4];
  if (!Number.isFinite(iter) || !salt || !expected) return false;
  const hash = crypto.pbkdf2Sync(plain, salt, iter, KEYLEN, digest).toString("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

module.exports = { hashPassword, verifyPassword };
