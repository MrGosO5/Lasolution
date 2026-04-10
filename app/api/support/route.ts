import { NextResponse } from "next/server";

function apiBase() {
  return (process.env.INTERNAL_AUTH_API_URL || process.env.AUTH_API_URL || "http://localhost:4000").replace(/\/$/, "");
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const payload = {
    name: String(body.name ?? "").trim(),
    email: String(body.email ?? "").trim(),
    topic: String(body.topic ?? "autre").trim(),
    reference: String(body.reference ?? "").trim(),
    message: String(body.message ?? "").trim(),
  };

  if (!payload.name || !payload.email || !payload.message) {
    return NextResponse.json({ error: "Le nom, l’email et le message sont requis." }, { status: 400 });
  }

  const res = await fetch(`${apiBase()}/public/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean };
  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }
  return NextResponse.json(data);
}
