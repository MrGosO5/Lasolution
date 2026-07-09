import { requireAdminSession, proxyBackendJson } from "../../../_lib";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;
  const id = params?.id;
  if (!id) return Response.json({ error: "Identifiant manquant." }, { status: 400 });
  return proxyBackendJson(auth.token, `/admin/shipping-requests/${encodeURIComponent(id)}/zoho/approve`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}
