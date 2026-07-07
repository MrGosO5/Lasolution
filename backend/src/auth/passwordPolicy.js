const fs = require("fs");
const path = require("path");
const { isPwnedPassword } = require("./pwnedPassword");

const COMMON_PASSWORDS_PATH = path.join(__dirname, "common-passwords.txt");
const MIN_LENGTH_DEV = 8;
const MIN_LENGTH_PROD = 12;

const COMPROMISED_MSG =
  "Ce mot de passe est trop courant ou a été exposé dans une fuite de données. Choisissez-en un autre.";

let commonPasswordSet = null;

function loadCommonPasswords() {
  if (commonPasswordSet) return commonPasswordSet;
  const raw = fs.readFileSync(COMMON_PASSWORDS_PATH, "utf8");
  commonPasswordSet = new Set(
    raw
      .split(/\r?\n/)
      .map((l) => l.trim().toLowerCase())
      .filter(Boolean)
  );
  return commonPasswordSet;
}

function minPasswordLength() {
  return process.env.NODE_ENV === "production" ? MIN_LENGTH_PROD : MIN_LENGTH_DEV;
}

function isCommonPassword(plain) {
  if (!plain) return false;
  return loadCommonPasswords().has(String(plain).toLowerCase());
}

async function validatePasswordPolicy(plain) {
  const minLen = minPasswordLength();
  if (!plain || plain.length < minLen) {
    return {
      ok: false,
      error: `Le mot de passe doit contenir au moins ${minLen} caractères.`,
    };
  }

  if (isCommonPassword(plain)) {
    return { ok: false, error: COMPROMISED_MSG };
  }

  const pwned = await isPwnedPassword(plain);
  if (pwned) {
    return { ok: false, error: COMPROMISED_MSG };
  }

  return { ok: true };
}

module.exports = {
  validatePasswordPolicy,
  isCommonPassword,
  minPasswordLength,
  COMPROMISED_MSG,
};
