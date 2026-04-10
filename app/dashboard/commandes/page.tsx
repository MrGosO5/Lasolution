import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { lasolutionFetchJson } from "@/lib/lasolution-api";
import { DashboardHeader } from "../components/DashboardHeader";
import {
  CancelledIcon,
  CommandesPagination,
  CommandesSearchForm,
  DeliveredIcon,
  InProgressIcon,
  mapApiOrderToRow,
  PendingIcon,
  StatCard,
  StatusBadge,
  type DashboardOrderRow,
} from "./commandes-dashboard-parts";

type OrderApiRow = {
  id: string;
  status: string;
  userId: string;
  currency: string;
  createdAt: string;
  deliveryMode?: string | null;
  lines: { description: string; quantity: number; unitPrice: unknown; currency: string }[];
};

type OrdersListResponse = {
  data: OrderApiRow[];
  pagination: { page: number; pageSize: number; total: number };
};

type OrdersStatsResponse = {
  total: number;
  byStatus: Record<string, number>;
};

export default async function CommandesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await getServerSession(authOptions);

  const page = Math.max(1, parseInt(String(searchParams.page || "1"), 10) || 1);
  const q = String(searchParams.q || "").trim();
  const status = String(searchParams.status || "").trim();

  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("pageSize", "25");
  if (q) qs.set("search", q);
  if (status) qs.set("status", status);

  let rows: DashboardOrderRow[] = [];
  let pagination = { page, pageSize: 25, total: 0 };
  let stats: OrdersStatsResponse = { total: 0, byStatus: {} };
  let loadError: string | null = null;

  try {
    const res = await lasolutionFetchJson<OrdersListResponse>(`/orders?${qs.toString()}`);
    rows = (res.data || []).map(mapApiOrderToRow);
    pagination = res.pagination || pagination;
  } catch {
    loadError = "Impossible de charger les commandes (session ou API).";
  }

  try {
    stats = await lasolutionFetchJson<OrdersStatsResponse>("/orders/stats");
  } catch {
    /* stats optionnel */
  }

  const awaiting = stats.byStatus.AWAITING_PAYMENT ?? 0;
  const cancelled = stats.byStatus.CANCELLED ?? 0;
  const delivered = stats.byStatus.DELIVERED ?? 0;
  const inProgress = Math.max(0, stats.total - awaiting - cancelled - delivered);

  return (
    <>
      <DashboardHeader
        title="Commandes"
        subtitle="Suivez et gérez toutes les commandes"
        session={session}
        rightSlot={<CommandesSearchForm defaultQ={q} defaultStatus={status} />}
      />

      <div className="flex-1 overflow-y-auto p-6 md:pl-[23px] md:pt-[26px]">
        <div className="flex flex-col gap-[30px] max-w-[1150px]">
          {loadError ? (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{loadError}</p>
          ) : null}

          <section className="flex flex-row flex-wrap items-stretch gap-5">
            <StatCard
              value={String(awaiting)}
              label="En attente"
              icon={<PendingIcon />}
              className="bg-[#FFF9CA] text-[#C09A00]"
            />
            <StatCard
              value={String(cancelled)}
              label="Annulé"
              icon={<CancelledIcon />}
              className="bg-[#FFB4B4] text-[#A31F1F]"
            />
            <StatCard
              value={String(inProgress)}
              label="En cours"
              icon={<InProgressIcon />}
              className="bg-[#E3F2FD] text-[#1565C0]"
            />
            <StatCard
              value={String(delivered)}
              label="Livré"
              icon={<DeliveredIcon />}
              className="bg-[#B4FFB5] text-[#218922]"
            />
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex flex-row flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-figma-headerTitle">Liste des commandes</h2>
                <p className="text-sm text-figma-adminSub mt-0.5">
                  Filtres dans l’en-tête (recherche plein texte sur référence, client, libellé produit). Export tableur
                  bientôt.
                </p>
              </div>
            </div>

            <div className="border border-figma-tableBorder rounded-card overflow-hidden bg-white shadow-card">
              <table className="w-full">
                <thead>
                  <tr className="bg-figma-tableHeader border-b border-figma-tableBorder">
                    <th className="text-left font-semibold text-sm leading-[140%] text-black py-3 px-3">Référence</th>
                    <th className="text-left font-semibold text-sm leading-[140%] text-black py-3 px-3">Produits</th>
                    <th className="text-left font-semibold text-sm leading-[140%] text-black py-3 px-3">Mode</th>
                    <th className="text-left font-semibold text-sm leading-[140%] text-black py-3 px-3">Prix</th>
                    <th className="text-left font-semibold text-sm leading-[140%] text-black py-3 px-3">Date</th>
                    <th className="text-left font-semibold text-sm leading-[140%] text-black py-3 px-3">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 px-3 text-center text-sm text-figma-adminSub">
                        {loadError ? "—" : "Aucune commande pour ces critères."}
                      </td>
                    </tr>
                  ) : (
                    rows.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-figma-tableRowBorder last:border-0 bg-white hover:bg-figma-tableRowHover transition-colors duration-fast"
                      >
                        <td className="py-2 px-3 font-normal text-sm leading-[140%] text-black">
                          <Link
                            href={`/dashboard/commandes/${order.id}`}
                            className="text-figma-activeMenuText hover:underline"
                          >
                            {order.reference}
                          </Link>
                        </td>
                        <td className="py-2 px-3 font-normal text-sm leading-[140%] text-black">{order.produits}</td>
                        <td className="py-2 px-3 font-normal text-sm leading-[140%] text-black">{order.pays}</td>
                        <td className="py-2 px-3 font-normal text-sm leading-[140%] text-black">{order.prix}</td>
                        <td className="py-2 px-3 font-normal text-sm leading-[140%] text-black">{order.date}</td>
                        <td className="py-2 px-3 font-normal text-sm leading-[140%]">
                          <StatusBadge status={order.statut} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <CommandesPagination
              page={pagination.page}
              pageSize={pagination.pageSize}
              total={pagination.total}
              q={q}
              status={status}
            />
          </section>
        </div>
      </div>
    </>
  );
}
