import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { getNextAuthSecret } from "@/lib/nextauth-secret";
import { getServerAuthApiUrl } from "@/lib/auth-api-url";

const AUTH_API_URL = getServerAuthApiUrl();

/**
 * Rafraîchit les jetons backend à partir du refresh stocké dans le JWT NextAuth.
 * Le client doit ensuite appeler `useSession().update({ accessToken, refreshToken })`
 * (le refresh reste dans le JWT, pas exposé sur session.user).
 */
export async function POST(req: NextRequest) {
  const secret = getNextAuthSecret();

  const token = await getToken({ req, secret });
  const refresh = token?.refreshToken;
  if (!refresh || typeof refresh !== "string") {
    return NextResponse.json({ error: "Pas de refresh token." }, { status: 401 });
  }

  const r = await fetch(`${AUTH_API_URL.replace(/\/$/, "")}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: refresh }),
  });

  if (!r.ok) {
    return NextResponse.json({ error: "Refresh backend refusé." }, { status: 401 });
  }

  const data = (await r.json()) as {
    accessToken: string;
    refreshToken: string;
    user: { id: string; email: string; role: string; name: string };
  };

  return NextResponse.json({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });
}
