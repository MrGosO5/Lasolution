import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { decode } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { getNextAuthSecret } from "@/lib/nextauth-secret";
import { parseJwtSub } from "@/lib/jwt-payload";

function apiBaseUrl() {
  return (
    process.env.INTERNAL_AUTH_API_URL ||
    process.env.AUTH_API_URL ||
    "http://localhost:4000"
  ).replace(/\/$/, "");
}

const DEMO_CLIENT_EMAIL = "client@lasolution.demo";
const LEGACY_DEMO_CLIENT_SUB = "client-client@lasolution.demo";

/** Récupère un jeton API frais pour le client démo (contourne un vieux Bearer en cookie). */
async function fetchFreshDemoClientAccessToken(): Promise<string | null> {
  const password = process.env.CLIENT_PASSWORD || "client";
  const res = await fetch(`${apiBaseUrl()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: DEMO_CLIENT_EMAIL, password }),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { accessToken?: string };
  const token = data.accessToken ?? null;
  if (token && parseJwtSub(token) === "client-demo") return token;
  return token;
}

function accessTokenExpired(token: string, skewSeconds = 45): boolean {
  try {
    const part = token.split(".")[1];
    if (!part) return true;
    const payload = JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as { exp?: number };
    if (!payload.exp) return true;
    return payload.exp * 1000 <= Date.now() + skewSeconds * 1000;
  } catch {
    return true;
  }
}

function sessionCookieName(secure: boolean): string {
  return secure ? "__Secure-next-auth.session-token" : "next-auth.session-token";
}

async function readJwtPayload() {
  const cookieStore = await cookies();
  const secret = getNextAuthSecret();
  const secure =
    process.env.NODE_ENV === "production" ||
    process.env.NEXTAUTH_URL?.startsWith("https://") === true;
  const sessionToken = cookieStore.get(sessionCookieName(secure))?.value;
  if (!sessionToken) return null;
  return decode({ token: sessionToken, secret });
}

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const res = await fetch(`${apiBaseUrl()}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });
  if (!res.ok) return null;

  const data = (await res.json()) as { accessToken?: string };
  return data.accessToken ?? null;
}

/**
 * Jeton Bearer API pour SSR : lit le JWT NextAuth, rafraîchit si expiré (~15 min).
 */
export async function getBackendAccessToken(options?: { forceRefresh?: boolean }): Promise<string | null> {
  const jwt = await readJwtPayload();
  const fromJwt = typeof jwt?.accessToken === "string" ? jwt.accessToken : null;

  if (!options?.forceRefresh && fromJwt && !accessTokenExpired(fromJwt)) {
    if (parseJwtSub(fromJwt) === LEGACY_DEMO_CLIENT_SUB) {
      const fresh = await fetchFreshDemoClientAccessToken();
      if (fresh) return fresh;
    }
    return fromJwt;
  }

  const refresh =
    typeof jwt?.refreshToken === "string" && jwt.refreshToken.length > 0
      ? jwt.refreshToken
      : null;
  if (refresh) {
    const renewed = await refreshAccessToken(refresh);
    if (renewed) return renewed;
  }

  const session = await getServerSession(authOptions);
  const fromSession = session?.user?.accessToken;
  if (fromSession && !accessTokenExpired(fromSession)) {
    return fromSession;
  }

  return typeof fromSession === "string" && fromSession.length > 0 ? fromSession : null;
}
