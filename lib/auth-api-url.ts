/**
 * URL de l’API Express pour les appels **côté serveur** (NextAuth, routes API, SSR).
 * Sur le VPS, le backend n’est pas exposé via Nginx : utiliser 127.0.0.1:4000.
 */
function isLoopbackHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function getServerAuthApiUrl(): string {
  const internal = process.env.INTERNAL_AUTH_API_URL?.trim();
  if (internal) return internal.replace(/\/$/, "");

  const auth = process.env.AUTH_API_URL?.trim();
  if (auth) {
    try {
      const { hostname } = new URL(auth);
      if (isLoopbackHost(hostname)) return auth.replace(/\/$/, "");
    } catch {
      /* ignore */
    }
  }

  return "http://127.0.0.1:4000";
}
