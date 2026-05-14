import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function apiBaseUrl() {
  return (
    process.env.INTERNAL_AUTH_API_URL ||
    process.env.AUTH_API_URL ||
    "http://localhost:4000"
  );
}

/**
 * Appel authentifié vers l’API Lasolution (SSR / Server Actions).
 * Utilise `accessToken` issu du login backend (stocké dans le JWT NextAuth).
 */
export async function lasolutionFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const session = await getServerSession(authOptions);
  const accessToken = session?.user?.accessToken;

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

  return fetch(url, { ...init, headers });
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
