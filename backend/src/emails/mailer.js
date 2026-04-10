const nodemailer = require("nodemailer");

/**
 * Expéditeur nodemailer : évite les .env mal quotés (`MAIL_FROM="Nom" <a@b>` → souvent tronqué par dotenv).
 * Préférez MAIL_FROM=adresse@domaine.tld et optionnellement MAIL_FROM_NAME=Nom affiché.
 */
function buildMailFrom() {
  const nameOverride = (process.env.MAIL_FROM_NAME || "").trim();
  const raw = (process.env.MAIL_FROM || "").trim();
  const fallbackAddr =
    (process.env.CUSTOMERCARE_EMAIL || "").trim() || "no-reply@lasolution.local";

  let displayName = nameOverride;
  let address = "";

  if (raw) {
    const bracket = /<([^>\s]+@[^>\s]+)\s*>/.exec(raw);
    if (bracket) {
      address = bracket[1].trim();
      if (!displayName) {
        const before = raw.slice(0, bracket.index).trim().replace(/^["']+|["']+$/g, "").trim();
        if (before) displayName = before;
      }
    } else if (/^[^\s<]+@[^\s>]+$/.test(raw)) {
      address = raw;
    }
  }

  if (!address) address = fallbackAddr;
  if (displayName) return { name: displayName, address };

  return address;
}

function createSmtpTransporter() {
  const host = process.env.SMTP_HOST || "localhost";
  const port = Number(process.env.SMTP_PORT || 1025);
  const isLocal = host === "localhost" || host === "127.0.0.1";
  const tls =
    !isLocal && port !== 1025
      ? {
          minVersion: "TLSv1.2",
          servername: (process.env.SMTP_TLS_SERVERNAME || host).trim(),
        }
      : undefined;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    tls,
    auth:
      process.env.SMTP_USER?.trim() && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER.trim(),
            pass: String(process.env.SMTP_PASS).trim(),
          }
        : undefined,
  });
}

/**
 * Envoie un email. Ne rejette jamais — log l'erreur et continue.
 * @param {{ to: string, subject: string, html: string, text: string }} opts
 */
async function sendMail({ to, subject, html, text }) {
  if (!process.env.SMTP_HOST || process.env.SMTP_HOST === "localhost") {
    // En dev sans SMTP configuré : log uniquement
    console.log(`[mailer] (dev/no-smtp) To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    const transporter = createSmtpTransporter();
    await transporter.sendMail({
      from: buildMailFrom(),
      to,
      subject,
      html,
      text,
    });
    console.log(`[mailer] Sent: ${subject} → ${to}`);
  } catch (err) {
    console.error(`[mailer] Erreur envoi email (${to}):`, err?.message || err);
  }
}

module.exports = { sendMail, createSmtpTransporter, buildMailFrom };
