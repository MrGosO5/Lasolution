import { getServerSession } from "next-auth";
import Link from "next/link";
import { DeliveryTruck } from "iconoir-react";
import { authOptions } from "@/lib/auth";
import { getAdminStats } from "@/lib/admin-stats";
import { DashboardHeader } from "./components/DashboardHeader";

function formatRevenue(n: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  const stats = await getAdminStats();
  const pendingAvis = stats.pendingTestimonials ?? 0;

  return (
    <>
      <DashboardHeader
        title="Tableau de bord"
        subtitle="Vue d’ensemble de votre activité"
        session={session}
      />
      <div className="flex-1 overflow-y-auto p-6 md:pl-6 md:pt-6">
        <div className="flex flex-col gap-8 max-w-[1150px]">
              {pendingAvis > 0 ? (
                <Link
                  href="/dashboard/avis?status=PENDING"
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-card border border-amber-200 bg-amber-50 px-4 py-3.5 shadow-card hover:bg-amber-100/80 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white text-sm font-bold">
                      {pendingAvis > 99 ? "99+" : pendingAvis}
                    </span>
                    <div>
                      <p className="font-semibold text-figma-headerTitle">
                        {pendingAvis === 1
                          ? "1 avis en attente de validation"
                          : `${pendingAvis} avis en attente de validation`}
                      </p>
                      <p className="text-sm text-figma-adminSub mt-0.5">
                        Des clients ont laissé un témoignage à modérer avant publication sur le site.
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-figma-activeMenuText shrink-0 sm:pl-4">
                    Modérer les avis →
                  </span>
                </Link>
              ) : null}

              {/* KPI row */}
              <section className="flex flex-row flex-wrap gap-4" aria-label="Indicateurs clés">
                <KpiCard
                  title="Chiffre d’affaire"
                  value={formatRevenue(stats.revenue)}
                  icon={<WalletIcon />}
                />
                <KpiCard
                  title="Commandes"
                  value={String(stats.totalOrders)}
                  icon={<PackageIcon />}
                />
                <KpiCard
                  title="Clients"
                  value={String(stats.totalClients)}
                  icon={<UsersIcon />}
                />
                <KpiCard
                  title="Solupackers"
                  value={String(stats.totalSolupackers)}
                  icon={<DeliveryTruck width={20} height={20} className="shrink-0 grow-0 flex-none text-[#555]" strokeWidth={1.5} />}
                />
                <KpiCard
                  title="Points relais"
                  value={String(stats.totalRelais)}
                  icon={<MapPinIcon />}
                />
                <KpiCard
                  title="Avis en attente"
                  value={String(pendingAvis)}
                  href={pendingAvis > 0 ? "/dashboard/avis?status=PENDING" : "/dashboard/avis"}
                  icon={<StarIcon />}
                  highlight={pendingAvis > 0}
                />
              </section>

              {/* Charts row */}
              <section className="flex flex-row flex-wrap gap-4">
                <OrdersStatusChart byStatus={stats.byStatus} totalOrders={stats.totalOrders} />
                <UsersBreakdownChart
                  clients={stats.totalClients}
                  solupackers={stats.totalSolupackers}
                  relais={stats.totalRelais}
                />
              </section>

              {/* Table commandes récentes */}
              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-lg text-figma-headerTitle">
                      Nouvelles commandes
                    </h2>
                    <p className="text-sm text-figma-adminSub mt-0.5">
                      Dernières commandes à traiter. Cliquez sur une référence pour ouvrir le détail.
                    </p>
                  </div>
                  <Link
                    href="/dashboard/commandes"
                    className="text-sm font-medium text-figma-activeMenuText hover:underline"
                  >
                    Voir tout →
                  </Link>
                </div>
                <RecentOrdersTable byStatus={stats.byStatus} totalOrders={stats.totalOrders} />
              </section>
            </div>
      </div>
    </>
  );
}

function RecentOrdersTable({ byStatus, totalOrders }: { byStatus: Record<string, number>; totalOrders: number }) {
  const statusLabels: Record<string, { label: string; colorClass: string }> = {
    AWAITING_PAYMENT: { label: "En attente", colorClass: "bg-figma-statusPendingBg text-figma-statusPending" },
    PAID: { label: "Payé", colorClass: "bg-blue-50 text-blue-700" },
    DELIVERED: { label: "Livré", colorClass: "bg-[#B4FFB5] text-[#218922]" },
    CANCELLED: { label: "Annulé", colorClass: "bg-[#FFB4B4] text-[#A31F1F]" },
  };

  if (totalOrders === 0) {
    return (
      <div className="border border-figma-tableBorder rounded-card bg-white shadow-card py-10 px-4 text-center text-sm text-figma-adminSub">
        Aucune commande pour le moment.
      </div>
    );
  }

  return (
    <div className="border border-figma-tableBorder rounded-card overflow-hidden bg-white shadow-card">
      <div className="overflow-x-auto">
      <table className="w-full min-w-[420px]">
        <thead>
          <tr className="bg-figma-tableHeader border-b border-figma-tableBorder">
            <th className="text-left font-semibold text-sm text-figma-headerTitle py-3.5 px-4">Statut</th>
            <th className="text-right font-semibold text-sm text-figma-headerTitle py-3.5 px-4">Nombre</th>
            <th className="text-right font-semibold text-sm text-figma-headerTitle py-3.5 px-4">% du total</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(byStatus).map(([status, count]) => {
            const info = statusLabels[status] ?? { label: status, colorClass: "bg-gray-100 text-gray-600" };
            const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;
            return (
              <tr key={status} className="border-b border-figma-tableRowBorder last:border-0 bg-white hover:bg-figma-tableRowHover">
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-semibold text-xs ${info.colorClass}`}>
                    {info.label}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-figma-headerTitle text-right font-medium">{count}</td>
                <td className="py-3 px-4 text-sm text-figma-adminSub text-right">{pct} %</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
      <div className="px-4 py-2.5 bg-figma-tableHeader border-t border-figma-tableBorder text-right">
        <Link href="/dashboard/commandes" className="text-sm font-medium text-figma-activeMenuText hover:underline">
          Gérer toutes les commandes →
        </Link>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon,
  href,
  highlight,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  href?: string;
  highlight?: boolean;
}) {
  const inner = (
    <>
      <div className="flex flex-row items-center gap-2">
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors duration-fast ${
            highlight
              ? "bg-amber-100 text-amber-700"
              : "bg-figma-tableHeader text-figma-label group-hover:bg-figma-activeMenu/10"
          }`}
        >
          {icon}
        </div>
        <span className="font-medium text-sm text-figma-adminSub">{title}</span>
      </div>
      <div className="flex flex-col gap-2">
        <span
          className={`font-extrabold text-2xl ${highlight ? "text-amber-700" : "text-figma-headerTitle"}`}
        >
          {value}
        </span>
      </div>
    </>
  );

  const className = `group box-border flex flex-col justify-between min-h-[140px] flex-1 min-w-[160px] max-w-[220px] p-4 gap-3 bg-white border rounded-card shadow-card hover:shadow-cardHover transition-smooth duration-normal ${
    highlight ? "border-amber-200 ring-1 ring-amber-100" : "border-figma-cardBorder"
  }`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  return <article className={className}>{inner}</article>;
}

function OrdersStatusChart({
  byStatus,
  totalOrders,
}: {
  byStatus: Record<string, number>;
  totalOrders: number;
}) {
  const statuses = [
    { key: "AWAITING_PAYMENT", label: "En attente",  color: "#C09A00", bg: "#FFF9CA" },
    { key: "PAID",             label: "Payé",         color: "#1565C0", bg: "#E3F2FD" },
    { key: "DELIVERED",        label: "Livré",        color: "#218922", bg: "#B4FFB5" },
    { key: "CANCELLED",        label: "Annulé",       color: "#A31F1F", bg: "#FFB4B4" },
  ];

  return (
    <div className="flex-1 min-w-[280px] border border-figma-tableBorder rounded-card overflow-hidden bg-white shadow-card">
      <div className="flex flex-row justify-between items-center py-3 px-4 bg-figma-tableHeader border-b border-figma-tableBorder">
        <h3 className="font-semibold text-base text-figma-headerTitle">Commandes par statut</h3>
        <span className="text-xs text-figma-adminSub">{totalOrders} au total</span>
      </div>
      <div className="p-4 grid gap-3">
        {totalOrders === 0 ? (
          <p className="text-sm text-figma-adminSub text-center py-10">Aucune commande enregistrée.</p>
        ) : (
          statuses.map(({ key, label, color, bg }) => {
            const count = byStatus[key] ?? 0;
            const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;
            return (
              <div key={key} className="grid gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-figma-headerTitle">{label}</span>
                  <span className="text-figma-adminSub">{count} ({pct}%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-figma-tableHeader overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function UsersBreakdownChart({
  clients,
  solupackers,
  relais,
}: {
  clients: number;
  solupackers: number;
  relais: number;
}) {
  const total = clients + solupackers + relais;
  const rows = [
    { label: "Clients",       count: clients,    color: "#218922" },
    { label: "Solupackers",   count: solupackers, color: "#AA1229" },
    { label: "Points relais", count: relais,      color: "#1565C0" },
  ];

  return (
    <div className="flex-1 min-w-[280px] border border-figma-tableBorder rounded-card overflow-hidden bg-white shadow-card">
      <div className="flex flex-row justify-between items-center py-3 px-4 bg-figma-tableHeader border-b border-figma-tableBorder">
        <h3 className="font-semibold text-base text-figma-headerTitle">Répartition utilisateurs</h3>
        <span className="text-xs text-figma-adminSub">{total} au total</span>
      </div>
      <div className="p-4 grid gap-3">
        {total === 0 ? (
          <p className="text-sm text-figma-adminSub text-center py-10">Aucun utilisateur enregistré.</p>
        ) : (
          rows.map(({ label, count, color }) => {
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={label} className="grid gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-figma-headerTitle">{label}</span>
                  <span className="text-figma-adminSub">{count} ({pct}%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-figma-tableHeader overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


function WalletIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#555]">
      <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 10h20" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#555]">
      <path d="M4 8l8-4 8 4v8l-8 4-8-4V8z" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4 8l8 4 8-4M12 12v8" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#555]">
      <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 19c0-2.5 2-4 6-4s6 1.5 6 4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 11c2.2 0 4 1.2 4 3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="15" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#555]">
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-current">
      <path
        d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}


