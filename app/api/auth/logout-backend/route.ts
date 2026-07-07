import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { getNextAuthSecret } from "@/lib/nextauth-secret";

const AUTH_API_URL = process.env.AUTH_API_URL ?? process.env.INTERNAL_AUTH_API_URL ?? "http://localhost:4000";

export async function POST(req: NextRequest) {
  const secret = getNextAuthSecret();
  const token = await getToken({ req, secret });
  const refresh = token?.refreshToken;

  if (!refresh || typeof refresh !== "string") {
    return NextResponse.json({ error: "Pas de refresh token." }, { status: 401 });
  }

  const r = await fetch(`${AUTH_API_URL.replace(/\/$/, "")}/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: refresh }),
  });

  if (!r.ok) {
    const data = (await r.json().catch(() => ({}))) as { error?: string };
    return NextResponse.json(data, { status: r.status });
  }

  return NextResponse.json({ ok: true });
}
