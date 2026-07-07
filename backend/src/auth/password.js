const crypto = require("crypto");
const argon2 = require("argon2");

const PBKDF2_ITER = 120000;
const KEYLEN = 64;
const DIGEST = "sha512";

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
};

function isPbkdf2Hash(stored) {
  return String(stored || "").startsWith("pbkdf2:");
}

function isArgon2Hash(stored) {
  return String(stored || "").startsWith("$argon2");
}

async function hashPassword(plain) {
  return argon2.hash(plain, ARGON2_OPTIONS);
}

function hashPasswordSync(plain) {
  // Compatibilité scripts seed synchrones — préférer hashPassword async.
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(plain, salt, PBKDF2_ITER, KEYLEN, DIGEST).toString("hex");
  return `pbkdf2:${DIGEST}:${PBKDF2_ITER}:${salt}:${hash}`;
}

function verifyPbkdf2(plain, stored) {
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

async function verifyPassword(plain, stored) {
  if (!stored || typeof plain !== "string") return false;
  if (isArgon2Hash(stored)) {
    try {
      return await argon2.verify(stored, plain);
    } catch {
      return false;
    }
  }
  if (isPbkdf2Hash(stored)) {
    return verifyPbkdf2(plain, stored);
  }
  return false;
}

function needsRehash(stored) {
  return isPbkdf2Hash(stored);
}

module.exports = {
  hashPassword,
  hashPasswordSync,
  verifyPassword,
  needsRehash,
  isPbkdf2Hash,
  isArgon2Hash,
};
