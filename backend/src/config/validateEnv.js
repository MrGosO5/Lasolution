const INSECURE_SECRETS = new Set([
  "dev-insecure-change-me",
  "dev-secret-change-en-production",
]);

function requireEnv(name, { allowInsecure = false } = {}) {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`[validateEnv] ${name} est obligatoire en production.`);
  }
  if (!allowInsecure && INSECURE_SECRETS.has(value)) {
    throw new Error(`[validateEnv] ${name} utilise une valeur par défaut non sécurisée.`);
  }
  return value;
}

function validateEnv() {
  if (process.env.NODE_ENV !== "production") return;

  requireEnv("DATABASE_URL");
  requireEnv("API_JWT_SECRET");
  requireEnv("NEXTAUTH_SECRET");

  if (!process.env.REDIS_URL) {
    console.warn("[validateEnv] REDIS_URL absent — rate limiting en mémoire (non distribué).");
  }

  if (process.env.AUTH_ENV_FALLBACK !== "false") {
    console.warn(
      "[validateEnv] AUTH_ENV_FALLBACK n'est pas 'false' — le login par variables d'environnement reste actif."
    );
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (stripeKey && stripeKey.startsWith("sk_live_") && !process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn("[validateEnv] STRIPE_WEBHOOK_SECRET recommandé avec une clé Stripe live.");
  }
}

module.exports = { validateEnv, requireEnv };
