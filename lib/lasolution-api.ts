import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getBackendAccessToken } from "@/lib/backend-access-token";
import { getServerAuthApiUrl } from "@/lib/auth-api-url";

function apiBaseUrl() {
  return getServerAuthApiUrl();
}

/**
 * Appel authentifié vers l’API Lasolution (SSR / Server Actions).
 * Utilise `accessToken` issu du login backend (stocké dans le JWT NextAuth).
 */
export async function lasolutionFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const session = await getServerSession(authOptions);
  let accessToken = await getBackendAccessToken();

  const url = path.startsWith("http") ? path : `${apiBaseUrl().replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;

  /** Toutes les routes Lasolution ciblées ici attendent le Bearer API (émis au login si PostgreSQL OK). */
  if (session?.user && !accessToken) {
    throw new Error(
      "Jeton API absent (accessToken). Déconnectez-vous puis reconnectez-vous — au login, le backend doit joindre PostgreSQL pour émettre le jeton.",
    );
  }

  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let res = await fetch(url, { ...init, headers, cache: init.cache ?? "no-store" });

  if (res.status === 401 && session?.user) {
    const refreshed = await getBackendAccessToken({ forceRefresh: true });
    if (refreshed && refreshed !== accessToken) {
      accessToken = refreshed;
      headers.set("Authorization", `Bearer ${accessToken}`);
      res = await fetch(url, { ...init, headers, cache: init.cache ?? "no-store" });
    }
  }

  return res;
}

export async function lasolutionFetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await lasolutionFetch(path, init);
  if (!res.ok) {
    const text = await res.text();
    const snippet = (text || res.statusText).trim().slice(0, 800);
    throw new Error(`API ${res.status}${snippet ? `: ${snippet}` : ""}`);
  }
  return res.json() as Promise<T>;
}
