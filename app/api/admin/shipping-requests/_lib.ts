import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServerAuthApiUrl } from "@/lib/auth-api-url";
import { NextResponse } from "next/server";

export async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  const token = session?.user?.accessToken;
  if (typeof token !== "string" || !token) {
    return { error: NextResponse.json({ error: "Non authentifié." }, { status: 401 }) };
  }
  if (session.user.role !== "admin") {
    return { error: NextResponse.json({ error: "Réservé aux administrateurs." }, { status: 403 }) };
  }
  return { token, session };
}

export function backendBase() {
  return getServerAuthApiUrl().replace(/\/$/, "");
}

export async function proxyBackendJson(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<NextResponse> {
  const res = await fetch(`${backendBase()}${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
