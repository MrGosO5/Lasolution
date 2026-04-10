import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

function apiBase() {
  return (process.env.INTERNAL_AUTH_API_URL || process.env.AUTH_API_URL || "http://localhost:4000").replace(/\/$/, "");
}

async function bearer(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const t = session?.user?.accessToken;
  return typeof t === "string" && t.length > 0 ? t : null;
}

export async function GET() {
  const token = await bearer();
  if (!token) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  const res = await fetch(`${apiBase()}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(req: Request) {
  const token = await bearer();
  if (!token) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }
  const res = await fetch(`${apiBase()}/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
