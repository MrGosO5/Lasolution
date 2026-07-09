import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { getNextAuthSecret } from "@/lib/nextauth-secret";
import { getServerAuthApiUrl } from "@/lib/auth-api-url";

const AUTH_API_URL = getServerAuthApiUrl();

async function backendFetch(req: NextRequest, path: string, init?: RequestInit) {
  const secret = getNextAuthSecret();
  const token = await getToken({ req, secret });
  const access = token?.accessToken;
  if (!access || typeof access !== "string") {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const r = await fetch(`${AUTH_API_URL.replace(/\/$/, "")}${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${access}`,
      "Content-Type": "application/json",
    },
  });

  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}

export async function GET(req: NextRequest) {
  return backendFetch(req, "/auth/sessions");
}

export async function DELETE(req: NextRequest) {
  const secret = getNextAuthSecret();
  const token = await getToken({ req, secret });
  const refresh = token?.refreshToken;
  return backendFetch(req, "/auth/sessions", {
    method: "DELETE",
    body: JSON.stringify({ refreshToken: typeof refresh === "string" ? refresh : undefined }),
  });
}
