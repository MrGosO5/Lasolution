/**
 * Secret aligné sur `authOptions.secret` : le middleware doit utiliser la même valeur
 * que la route `/api/auth/*`, sinon `getToken` échoue en dev sans `.env`.
 */
const DEV_FALLBACK = "dev-secret-change-en-production";

export function getNextAuthSecret(): string {
  return process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || DEV_FALLBACK;
}
