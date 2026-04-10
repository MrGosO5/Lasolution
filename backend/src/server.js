const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const { setupRoutes } = require("./routes");
const { mountStripeWebhook } = require("./routes/stripeWebhook");

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config();
require("./db");

const app = express();
const port = process.env.BACKEND_PORT || 4000;

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";
const adminEmail = process.env.ADMIN_EMAIL || "adminlasolution@gmail.com";
const adminPassword = process.env.ADMIN_PASSWORD || "adminlasolution@x";
const clientPassword = process.env.CLIENT_PASSWORD || "client";
const partnerPassword = process.env.PARTNER_PASSWORD || "partner";

const demoPartners = [
  {
    id: "relais-1",
    email: process.env.DEMO_RELAI_EMAIL || "relais@lasolution.demo",
    role: "relais",
    name: "Partenaire Relais",
  },
  {
    id: "packer-1",
    email: process.env.DEMO_PACKER_EMAIL || "packer@lasolution.demo",
    role: "solupacker",
    name: "Solupacker",
  },
  {
    id: "livreur-1",
    email: process.env.DEMO_LIVREUR_EMAIL || "livreur@lasolution.demo",
    role: "solu_livreur",
    name: "Solu livreur",
  },
  {
    id: "amb-1",
    email: process.env.DEMO_AMBASSADEUR_EMAIL || "ambassadeur@lasolution.demo",
    role: "ambassadeur",
    name: "Ambassadeur",
  },
];

app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  })
);

/** Stripe exige le corps brut — avant express.json() */
mountStripeWebhook(app);

// Les formulaires envoient des photos (data URL base64) -> augmenter la limite JSON.
app.use(express.json({ limit: "10mb" }));

// Sert les preuves visuelles stockées localement (dev)
const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
app.use("/uploads", express.static(uploadDir, { fallthrough: true }));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "lasolution-api",
    /** Présent si le code gère l’échec SMTP des demandes d’expédition sans HTTP 500. */
    shippingRequestEmailSoftFail: true,
  });
});

setupRoutes(app, {
  adminEmail,
  adminPassword,
  clientPassword,
  partnerPassword,
  demoPartners,
});

app.listen(port, () => {
  console.log(`Lasolution backend running on http://localhost:${port}`);
  scheduleSmtpVerify();
});

/** Avertit tout de suite si SMTP_USER/SMTP_PASS sont refusés (ex. IONOS 535). */
function scheduleSmtpVerify() {
  const host = process.env.SMTP_HOST;
  if (!host || host === "localhost" || host === "127.0.0.1") return;
  setImmediate(() => {
    try {
      const { createSmtpTransporter } = require("./emails/mailer");
      createSmtpTransporter()
        .verify()
        .then(() => console.log(`[smtp] ${host} : vérification OK`))
        .catch((e) =>
          console.warn(
            `[smtp] ${host} : échec — ${e.message || e}. Corrigez SMTP_USER/SMTP_PASS (ou MAIL_FROM) dans .env.local puis redémarrez.`
          )
        );
    } catch (e) {
      console.warn("[smtp] vérification ignorée:", e?.message || e);
    }
  });
}
