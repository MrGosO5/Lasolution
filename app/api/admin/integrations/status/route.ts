import { requireAdminSession, proxyBackendJson } from "../../shipping-requests/_lib";

export async function GET() {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;
  return proxyBackendJson(auth.token, "/admin/integrations/status");
}
