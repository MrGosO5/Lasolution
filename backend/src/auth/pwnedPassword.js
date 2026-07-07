const crypto = require("crypto");
const https = require("https");

const HIBP_TIMEOUT_MS = 3000;

function sha1Hex(plain) {
  return crypto.createHash("sha1").update(plain, "utf8").digest("hex").toUpperCase();
}

function fetchHibpRange(prefix) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      `https://api.pwnedpasswords.com/range/${prefix}`,
      { headers: { "User-Agent": "Lasolution-Auth" }, timeout: HIBP_TIMEOUT_MS },
      (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HIBP status ${res.statusCode}`));
          res.resume();
          return;
        }
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => resolve(data));
      }
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("HIBP timeout"));
    });
  });
}

/**
 * Retourne true si le mot de passe apparaît dans HIBP (k-Anonymity).
 * En cas d'erreur réseau, retourne false (ne bloque pas — la liste locale reste active).
 */
async function isPwnedPassword(plain) {
  if (!plain) return false;
  try {
    const hash = sha1Hex(plain);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
    const body = await fetchHibpRange(prefix);
    const lines = body.split(/\r?\n/);
    for (const line of lines) {
      const [hashSuffix] = line.split(":");
      if (hashSuffix && hashSuffix.toUpperCase() === suffix) {
        return true;
      }
    }
    return false;
  } catch (e) {
    console.warn("[pwnedPassword] HIBP indisponible:", e.message || e);
    return false;
  }
}

module.exports = { isPwnedPassword, sha1Hex };
