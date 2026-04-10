import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const AUTH_API_URL = process.env.AUTH_API_URL ?? process.env.INTERNAL_AUTH_API_URL ?? "http://localhost:4000";

/**
 * Rafraîchit les jetons backend à partir du refresh stocké dans le JWT NextAuth.
 * Le client doit ensuite appeler `useSession().update({ accessToken, refreshToken })`
 * (le refresh reste dans le JWT, pas exposé sur session.user).
 */
export async function POST(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "NEXTAUTH_SECRET manquant." }, { status: 500 });
  }

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
