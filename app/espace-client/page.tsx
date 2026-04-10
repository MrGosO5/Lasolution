import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { lasolutionFetchJson } from "@/lib/lasolution-api";
import { SignOutButton } from "../components/SignOutButton";

type OrderRow = {
  id: string;
  status: string;
  currency: string;
  createdAt: string;
  parcels: { id: string; status: string }[];
};

type OrdersPayload = {
  data: OrderRow[];
  pagination: { page: number; pageSize: number; total: number };
};

export default async function EspaceClientPage() {
  const session = await getServerSession(authOptions);

  let orders: OrdersPayload | null = null;
  let ordersError: string | null = null;

  if (session?.user?.accessToken) {
    try {
      orders = await lasolutionFetchJson<OrdersPayload>("/orders?pageSize=15");
    } catch (e) {
      ordersError = e instanceof Error ? e.message : String(e);
    }
  } else {
    ordersError =
      "Aucun jeton API : la base PostgreSQL doit être joignable au login pour émettre accessToken / refreshToken. Démarrez la stack (Docker) et reconnectez-vous.";
  }

  return (
    <main className="min-h-screen bg-figma-page">
      <header className="flex items-center justify-between border-b border-figma-tableBorder bg-figma-card px-6 py-4 shadow-header">
        <h1 className="text-xl font-semibold text-figma-headerTitle">Espace client</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-figma-adminSub">{session?.user?.email}</span>
          <SignOutButton />
        </div>
      </header>
      <div className="mx-auto max-w-4xl p-6">
        <p className="text-figma-label">
          Bienvenue, <strong className="text-figma-headerTitle">{session?.user?.email}</strong>. Rôle{" "}
          <strong>client</strong>.
        </p>

        <section className="mt-8 rounded-card border border-figma-cardBorder bg-figma-card p-6 shadow-card">
          <h2 className="text-lg font-semibold text-figma-headerTitle">Mes commandes</h2>
          {ordersError && (
            <p className="mt-3 rounded-input border border-figma-statusPendingBg bg-figma-statusPendingBg/30 px-4 py-3 text-sm text-figma-statusPending">
              {ordersError}
            </p>
          )}
          {orders && orders.data.length === 0 && (
            <p className="mt-4 text-sm text-figma-adminSub">Aucune commande pour le moment.</p>
          )}
          {orders && orders.data.length > 0 && (
            <ul className="mt-4 divide-y divide-figma-tableRowBorder">
              {orders.data.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-4 text-sm">
                  <div>
                    <span className="font-mono text-xs text-figma-adminSub">{o.id}</span>
                    <p className="font-medium text-figma-headerTitle">{o.status}</p>
                    <p className="text-figma-adminSub">
                      {o.currency} · {new Date(o.createdAt).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  <div className="text-right text-figma-label">
                    {o.parcels?.length ?? 0} colis
                    {o.parcels?.[0] ? ` · ${o.parcels[0].status}` : ""}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
