import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

function apiBase() {
  return (process.env.INTERNAL_AUTH_API_URL || process.env.AUTH_API_URL || "http://localhost:4000").replace(/\/$/, "");
}

export async function PATCH(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const token = session?.user?.accessToken;
  if (typeof token !== "string" || !token) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Réservé aux administrateurs." }, { status: 403 });
  }

  const id = params?.id;
  if (!id) return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });

  const res = await fetch(`${apiBase()}/admin/applications/${encodeURIComponent(id)}/accept`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
