import { requireAdminSession, proxyBackendJson } from "../../_lib";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;
  const id = params?.id;
  if (!id) return Response.json({ error: "Identifiant manquant." }, { status: 400 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON invalide." }, { status: 400 });
  }
  return proxyBackendJson(auth.token, `/admin/shipping-requests/${encodeURIComponent(id)}/communicate`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
