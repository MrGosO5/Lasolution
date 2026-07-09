import { requireAdminSession, backendBase } from "../../_lib";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;
  const id = params?.id;
  if (!id) return Response.json({ error: "Identifiant manquant." }, { status: 400 });

  const res = await fetch(`${backendBase()}/admin/shipping-requests/${encodeURIComponent(id)}/photo`, {
    headers: { Authorization: `Bearer ${auth.token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return Response.json(data, { status: res.status });
  }

  const buf = await res.arrayBuffer();
  return new Response(buf, {
    status: 200,
    headers: {
      "Content-Type": res.headers.get("content-type") || "image/jpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
