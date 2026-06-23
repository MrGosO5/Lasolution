/** Utilitaires partagés (middleware Edge + SSR Node) pour les jetons API backend. */

export const MIDDLEWARE_ACCESS_HEADER = "x-lasolution-access-token";

export function backendApiBaseUrl(): string {
  return (
    process.env.INTERNAL_AUTH_API_URL ||
    process.env.AUTH_API_URL ||
    "http://localhost:4000"
  ).replace(/\/$/, "");
}

function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json =
      typeof atob !== "undefined"
        ? atob(padded)
        : Buffer.from(part, "base64url").toString("utf8");
    return JSON.parse(json) as { exp?: number };
  } catch {
    return null;
  }
}

export function accessTokenExpired(token: string, skewSeconds = 45): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 <= Date.now() + skewSeconds * 1000;
}

export type BackendRefreshResult = {
  accessToken: string;
  refreshToken: string;
};

export async function refreshBackendTokens(
  refreshToken: string,
): Promise<BackendRefreshResult | null> {
  let res: Response;
  try {
    res = await fetch(`${backendApiBaseUrl()}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;

  const data = (await res.json()) as {
    accessToken?: string;
    refreshToken?: string;
  };
  if (!data.accessToken || !data.refreshToken) return null;
  return { accessToken: data.accessToken, refreshToken: data.refreshToken };
}

export function nextAuthSessionCookieName(secure: boolean): string {
  return secure ? "__Secure-next-auth.session-token" : "next-auth.session-token";
}
