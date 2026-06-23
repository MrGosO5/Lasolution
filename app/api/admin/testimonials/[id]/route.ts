import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PUBLIC_TESTIMONIALS_CACHE_TAG } from "@/lib/public-testimonials";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

function apiBase() {
  return (process.env.INTERNAL_AUTH_API_URL || process.env.AUTH_API_URL || "http://localhost:4000").replace(/\/$/, "");
}

async function adminAuth() {
  const session = await getServerSession(authOptions);
  const token = session?.user?.accessToken;
  if (typeof token !== "string" || !token) {
    return { error: NextResponse.json({ error: "Non authentifié." }, { status: 401 }) };
  }
  if (session.user.role !== "admin") {
    return { error: NextResponse.json({ error: "Réservé aux administrateurs." }, { status: 403 }) };
  }
  return { token };
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const auth = await adminAuth();
  if ("error" in auth) return auth.error;

  const id = params?.id;
  if (!id) return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });

  const res = await fetch(`${apiBase()}/admin/testimonials/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${auth.token}` },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await adminAuth();
  if ("error" in auth) return auth.error;

  const id = params?.id;
  if (!id) return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const res = await fetch(`${apiBase()}/admin/testimonials/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));

  if (res.ok) {
    revalidateTag(PUBLIC_TESTIMONIALS_CACHE_TAG);
    revalidatePath("/");
  }

  return NextResponse.json(data, { status: res.status });
}
