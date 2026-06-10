import { cookies, headers } from "next/headers";
import { getServerSession } from "next-auth";
import { decode } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { getNextAuthSecret } from "@/lib/nextauth-secret";
import { parseJwtSub } from "@/lib/jwt-payload";
import {
  accessTokenExpired,
  backendApiBaseUrl,
  MIDDLEWARE_ACCESS_HEADER,
  nextAuthSessionCookieName,
  refreshBackendTokens,
} from "@/lib/backend-token-utils";

const DEMO_CLIENT_EMAIL = "client@lasolution.demo";
const LEGACY_DEMO_CLIENT_SUB = "client-client@lasolution.demo";

/** Récupère un jeton API frais pour le client démo (contourne un vieux Bearer en cookie). */
async function fetchFreshDemoClientAccessToken(): Promise<string | null> {
  const password = process.env.CLIENT_PASSWORD || "client";
  const res = await fetch(`${backendApiBaseUrl()}/auth/login`, {
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

function sessionCookieName(secure: boolean): string {
  return nextAuthSessionCookieName(secure);
}

function isSecureCookie(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.NEXTAUTH_URL?.startsWith("https://") === true
  );
}

async function readJwtPayload() {
  const cookieStore = await cookies();
  const secret = getNextAuthSecret();
  const sessionToken = cookieStore.get(sessionCookieName(isSecureCookie()))?.value;
  if (!sessionToken) return null;
  return decode({ token: sessionToken, secret });
}

function pickValidAccessToken(token: string | null | undefined): string | null {
  if (!token || token.length === 0) return null;
  return accessTokenExpired(token) ? null : token;
}

/**
 * Jeton Bearer API pour SSR : lit le JWT NextAuth, rafraîchit si expiré (~15 min).
 * Le middleware peut injecter un jeton frais via en-tête pour la requête en cours.
 */
export async function getBackendAccessToken(options?: { forceRefresh?: boolean }): Promise<string | null> {
  const headerStore = await headers();
  const fromMiddleware = headerStore.get(MIDDLEWARE_ACCESS_HEADER);
  if (fromMiddleware && !accessTokenExpired(fromMiddleware)) {
    return fromMiddleware;
  }

  const jwt = await readJwtPayload();
  const fromJwt = typeof jwt?.accessToken === "string" ? jwt.accessToken : null;

  if (!options?.forceRefresh) {
    const validJwt = pickValidAccessToken(fromJwt);
    if (validJwt) {
      if (parseJwtSub(validJwt) === LEGACY_DEMO_CLIENT_SUB) {
        const fresh = await fetchFreshDemoClientAccessToken();
        if (fresh) return fresh;
      }
      return validJwt;
    }
  }

  const refresh =
    typeof jwt?.refreshToken === "string" && jwt.refreshToken.length > 0
      ? jwt.refreshToken
      : null;
  if (refresh) {
    const renewed = await refreshBackendTokens(refresh);
    if (renewed) return renewed.accessToken;
  }

  const session = await getServerSession(authOptions);
  return pickValidAccessToken(session?.user?.accessToken);
}
