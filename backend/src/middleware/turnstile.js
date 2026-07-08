const https = require("https");

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function isTurnstileConfigured() {
  return Boolean(String(process.env.TURNSTILE_SECRET_KEY || "").trim());
}

function verifyTurnstileToken(token, remoteip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn("[turnstile] TURNSTILE_SECRET_KEY absent — vérification ignorée.");
    return Promise.resolve({ ok: true, skipped: true });
  }

  if (!token || typeof token !== "string") {
    return Promise.resolve({ ok: false, error: "CAPTCHA requis.", code: "CAPTCHA_REQUIRED" });
  }

  const body = new URLSearchParams({
    secret,
    response: token,
    ...(remoteip ? { remoteip: String(remoteip) } : {}),
  }).toString();

  return new Promise((resolve) => {
    const req = https.request(
      TURNSTILE_VERIFY_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(body),
        },
        timeout: 5000,
      },
      (res) => {
        let data = "";
        res.on("data", (c) => {
          data += c;
        });
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            if (!parsed.success) {
              console.warn(
                "[turnstile] échec vérification — error-codes:",
                JSON.stringify(parsed["error-codes"] || [])
              );
            }
            resolve({ ok: !!parsed.success, error: parsed.success ? null : "CAPTCHA invalide." });
          } catch {
            resolve({ ok: false, error: "CAPTCHA invalide." });
          }
        });
      }
    );
    req.on("error", () => resolve({ ok: false, error: "Vérification CAPTCHA impossible." }));
    req.on("timeout", () => {
      req.destroy();
      resolve({ ok: false, error: "Vérification CAPTCHA expirée." });
    });
    req.write(body);
    req.end();
  });
}

async function requireTurnstile(req, res) {
  const token = req.body?.captchaToken || req.body?.turnstileToken;
  const result = await verifyTurnstileToken(token, req.ip);
  if (!result.ok) {
    res.status(400).json({
      error: result.error || "CAPTCHA invalide.",
      code: result.code || "CAPTCHA_REQUIRED",
    });
    return false;
  }
  return true;
}

module.exports = { verifyTurnstileToken, requireTurnstile, isTurnstileConfigured };
