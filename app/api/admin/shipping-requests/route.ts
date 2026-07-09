import { requireAdminSession, proxyBackendJson } from "./_lib";

export async function GET(req: Request) {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;
  const url = new URL(req.url);
  const limit = url.searchParams.get("limit");
  const qs = limit ? `?limit=${encodeURIComponent(limit)}` : "";
  return proxyBackendJson(auth.token, `/admin/shipping-requests${qs}`);
}
