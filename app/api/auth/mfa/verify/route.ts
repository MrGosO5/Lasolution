import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { getNextAuthSecret } from "@/lib/nextauth-secret";

const AUTH_API_URL = process.env.AUTH_API_URL ?? process.env.INTERNAL_AUTH_API_URL ?? "http://localhost:4000";

export async function POST(req: NextRequest) {
  const secret = getNextAuthSecret();
  const token = await getToken({ req, secret });
  const access = token?.accessToken;
  if (!access || typeof access !== "string") {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const body = await req.text();
  const r = await fetch(`${AUTH_API_URL.replace(/\/$/, "")}/auth/mfa/verify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access}`,
      "Content-Type": "application/json",
    },
    body,
  });

  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}
