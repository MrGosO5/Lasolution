import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { getNextAuthSecret } from "@/lib/nextauth-secret";
import { getServerAuthApiUrl } from "@/lib/auth-api-url";

const AUTH_API_URL = getServerAuthApiUrl();

async function proxy(req: NextRequest, path: string) {
  const secret = getNextAuthSecret();
  const token = await getToken({ req, secret });
  const access = token?.accessToken;
  if (!access || typeof access !== "string") {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const body = req.method === "POST" ? await req.text() : undefined;
  const r = await fetch(`${AUTH_API_URL.replace(/\/$/, "")}${path}`, {
    method: req.method,
    headers: {
      Authorization: `Bearer ${access}`,
      "Content-Type": "application/json",
    },
    body,
  });

  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  if (url.pathname.endsWith("/verify")) return proxy(req, "/auth/mfa/verify");
  if (url.pathname.endsWith("/disable")) return proxy(req, "/auth/mfa/disable");
  return proxy(req, "/auth/mfa/setup");
}
