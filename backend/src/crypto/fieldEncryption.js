const crypto = require("crypto");

const PREFIX = "enc:v1:";

function getKey() {
  const raw = process.env.DATA_ENCRYPTION_KEY;
  if (!raw) return null;
  try {
    const buf = Buffer.from(raw, "base64");
    if (buf.length !== 32) return null;
    return buf;
  } catch {
    return null;
  }
}

function encryptField(plain) {
  if (plain == null || plain === "") return plain;
  const key = getKey();
  if (!key) return plain;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64url")}:${tag.toString("base64url")}:${enc.toString("base64url")}`;
}

function decryptField(stored) {
  if (stored == null || stored === "") return stored;
  const s = String(stored);
  if (!s.startsWith(PREFIX)) return stored;
  const key = getKey();
  if (!key) return stored;
  const parts = s.slice(PREFIX.length).split(":");
  if (parts.length !== 3) return stored;
  const [ivB64, tagB64, dataB64] = parts;
  const iv = Buffer.from(ivB64, "base64url");
  const tag = Buffer.from(tagB64, "base64url");
  const data = Buffer.from(dataB64, "base64url");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString("utf8");
}

function encryptJsonFields(obj, keys) {
  if (!obj || typeof obj !== "object") return obj;
  const out = { ...obj };
  for (const k of keys) {
    if (typeof out[k] === "string" && out[k]) {
      out[k] = encryptField(out[k]);
    }
  }
  return out;
}

function decryptJsonFields(obj, keys) {
  if (!obj || typeof obj !== "object") return obj;
  const out = { ...obj };
  for (const k of keys) {
    if (typeof out[k] === "string" && out[k]) {
      out[k] = decryptField(out[k]);
    }
  }
  return out;
}

module.exports = {
  encryptField,
  decryptField,
  encryptJsonFields,
  decryptJsonFields,
};
