/**
 * Secret aligné sur `authOptions.secret` : le middleware doit utiliser la même valeur
 * que la route `/api/auth/*`, sinon `getToken` échoue en dev sans `.env`.
 */
const DEV_FALLBACK = "dev-secret-change-en-production";

const INSECURE_DEFAULTS = new Set([
  DEV_FALLBACK,
  "dev-insecure-change-me",
]);

export function getNextAuthSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXTAUTH_SECRET (ou AUTH_SECRET) est obligatoire en production. Définissez-le dans .env.local."
    );
  }

  return DEV_FALLBACK;
}

export function isInsecureSecret(value: string | undefined): boolean {
  if (!value) return true;
  return INSECURE_DEFAULTS.has(value);
}
