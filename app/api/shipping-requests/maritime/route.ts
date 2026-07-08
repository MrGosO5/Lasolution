import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function apiBase() {
  return (process.env.INTERNAL_AUTH_API_URL || process.env.AUTH_API_URL || "http://localhost:4000").replace(
    /\/$/,
    ""
  );
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  const token = session?.user?.accessToken;

  // Si connecté (client), on utilise la route /me pour associer userId à la demande.
  const url =
    typeof token === "string" && token
      ? `${apiBase()}/me/shipping-requests`
      : `${apiBase()}/shipping-requests/maritime`;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof token === "string" && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(text) as Record<string, unknown>;
  } catch {
    if (!res.ok) {
      return NextResponse.json({ error: text || `HTTP ${res.status}` }, { status: res.status });
    }
    return NextResponse.json({ ok: true });
  }

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }
  return NextResponse.json(data);
}
