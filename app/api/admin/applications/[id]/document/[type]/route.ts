import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

function apiBase() {
  return (process.env.INTERNAL_AUTH_API_URL || process.env.AUTH_API_URL || "http://localhost:4000").replace(/\/$/, "");
}

export async function GET(_: Request, { params }: { params: { id: string; type: string } }) {
  const session = await getServerSession(authOptions);
  const token = session?.user?.accessToken;
  if (typeof token !== "string" || !token) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Réservé aux administrateurs." }, { status: 403 });
  }

  const id = params?.id;
  const type = params?.type;
  if (!id || !type) {
    return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
  }

  const res = await fetch(
    `${apiBase()}/admin/applications/${encodeURIComponent(id)}/document/${encodeURIComponent(type)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  }

  const buf = await res.arrayBuffer();
  const contentType = res.headers.get("Content-Type") || "application/octet-stream";
  const disposition = res.headers.get("Content-Disposition") || `inline; filename="${type}"`;

  return new NextResponse(buf, {
    status: res.status,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": disposition,
      "Cache-Control": "no-store",
    },
  });
}
