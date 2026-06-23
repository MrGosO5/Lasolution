import { encode } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getNextAuthSecret } from "@/lib/nextauth-secret";
import {
  accessTokenExpired,
  nextAuthSessionCookieName,
  refreshBackendTokens,
} from "@/lib/backend-token-utils";
import { MIDDLEWARE_ACCESS_HEADER } from "@/lib/backend-token-utils";

const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

export type BackendTokenRefreshOutcome =
  | { kind: "unchanged" }
  | { kind: "updated"; accessToken: string; refreshToken: string }
  | { kind: "failed" };

export async function refreshBackendTokenIfNeeded(
  token: JWT,
): Promise<BackendTokenRefreshOutcome> {
  const accessToken = typeof token.accessToken === "string" ? token.accessToken : null;
  const refresh =
    typeof token.refreshToken === "string" && token.refreshToken.length > 0
      ? token.refreshToken
      : null;

  if (accessToken && !accessTokenExpired(accessToken)) {
    return { kind: "unchanged" };
  }

  if (!refresh) return { kind: "failed" };

  const renewed = await refreshBackendTokens(refresh);
  if (!renewed) return { kind: "failed" };

  return { kind: "updated", ...renewed };
}

export type BackendTokenRefreshContext = {
  outcome: BackendTokenRefreshOutcome;
  encodedSession: string | null;
};

export async function prepareBackendTokenRefresh(token: JWT): Promise<BackendTokenRefreshContext> {
  const outcome = await refreshBackendTokenIfNeeded(token);
  if (outcome.kind !== "updated") {
    return { outcome, encodedSession: null };
  }

  const encodedSession = await encode({
    token: {
      ...token,
      accessToken: outcome.accessToken,
      refreshToken: outcome.refreshToken,
    },
    secret: getNextAuthSecret(),
    maxAge: SESSION_MAX_AGE,
  });

  return { outcome, encodedSession };
}

export function nextResponseWithBackendRefresh(
  req: NextRequest,
  refresh: BackendTokenRefreshContext,
  secureCookie: boolean,
): NextResponse {
  if (refresh.outcome.kind === "updated" && refresh.encodedSession) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set(MIDDLEWARE_ACCESS_HEADER, refresh.outcome.accessToken);

    const res = NextResponse.next({
      request: { headers: requestHeaders },
    });
    res.cookies.set(nextAuthSessionCookieName(secureCookie), refresh.encodedSession, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: secureCookie,
      maxAge: SESSION_MAX_AGE,
    });
    return res;
  }

  return NextResponse.next();
}

export function attachRefreshedSessionCookie(
  response: NextResponse,
  refresh: BackendTokenRefreshContext,
  secureCookie: boolean,
): NextResponse {
  if (refresh.outcome.kind === "updated" && refresh.encodedSession) {
    response.cookies.set(nextAuthSessionCookieName(secureCookie), refresh.encodedSession, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: secureCookie,
      maxAge: SESSION_MAX_AGE,
    });
  }
  return response;
}

export function backendTokenRefreshFailed(refresh: BackendTokenRefreshContext): boolean {
  return refresh.outcome.kind === "failed";
}
