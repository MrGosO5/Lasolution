import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { getNextAuthSecret } from "@/lib/nextauth-secret";
import { getServerAuthApiUrl } from "@/lib/auth-api-url";

const AUTH_API_URL = getServerAuthApiUrl();

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const secret = getNextAuthSecret();
  const token = await getToken({ req, secret });
  const access = token?.accessToken;
  if (!access || typeof access !== "string") {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const r = await fetch(`${AUTH_API_URL.replace(/\/$/, "")}/auth/sessions/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${access}` },
  });

  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}
