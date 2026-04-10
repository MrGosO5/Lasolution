import Link from "next/link";
import type { ReactNode } from "react";

export type OrderStatus = "en_attente" | "annule" | "en_cours" | "livre";

export type DashboardOrderRow = {
  id: string;
  reference: string;
  produits: string;
  pays: string;
  prix: string;
  date: string;
  statut: OrderStatus;
};

export function mapApiStatusToBadge(status: string): OrderStatus {
  const s = String(status || "").toUpperCase();
  if (s === "AWAITING_PAYMENT") return "en_attente";
  if (s === "CANCELLED") return "annule";
  if (s === "DELIVERED") return "livre";
  return "en_cours";
}

export function formatOrderLinesSummary(
  lines: { description: string; quantity: number }[] | undefined
): string {
  if (!lines?.length) return "—";
  const parts = lines.slice(0, 2).map((l) => `${l.description} ×${l.quantity}`);
  const more = lines.length > 2 ? ` +${lines.length - 2}` : "";
  return `${parts.join(", ")}${more}`;
}

export function formatOrderTotal(
  lines: { quantity: number; unitPrice: unknown; currency?: string }[] | undefined,
  fallbackCurrency: string
): string {
  if (!lines?.length) return "—";
  let sum = 0;
  let cur = fallbackCurrency || "EUR";
  for (const l of lines) {
    sum += Number(l.unitPrice) * Math.max(1, l.quantity || 1);
    if (l.currency) cur = l.currency;
  }
  return `${sum.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur}`;
}

export function deliveryModeLabel(mode: string | null | undefined): string {
  const m = String(mode || "").toUpperCase();
  if (m === "AIR") return "Aérien";
  if (m === "SEA") return "Maritime";
  return "—";
}

export function mapApiOrderToRow(o: {
  id: string;
  status: string;
  deliveryMode?: string | null;
  createdAt: string;
  lines?: { description: string; quantity: number; unitPrice: unknown; currency: string }[];
  currency?: string;
}): DashboardOrderRow {
  const d = new Date(o.createdAt);
  return {
    id: o.id,
    reference: `#${o.id.slice(0, 8)}`,
    produits: formatOrderLinesSummary(o.lines),
    pays: deliveryModeLabel(o.deliveryMode),
    prix: formatOrderTotal(o.lines, o.currency || "EUR"),
    date: Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR"),
    statut: mapApiStatusToBadge(o.status),
  };
}

export function CommandesSearchForm({ defaultQ, defaultStatus }: { defaultQ: string; defaultStatus: string }) {
  return (
    <form action="/dashboard/commandes" method="get" className="flex flex-wrap items-center gap-2 justify-end">
      <label className="flex items-center gap-2 px-3 py-2 rounded-input border border-figma-tableBorder bg-white min-w-[200px] max-w-[280px] shadow-card focus-within:ring-2 focus-within:ring-figma-activeMenuText/20 focus-within:border-figma-activeMenuText/50 transition-shadow duration-fast">
        <SearchIcon className="w-4 h-4 text-[#777]" />
        <input
          name="q"
          type="search"
          defaultValue={defaultQ}
          placeholder="Réf., userId, produit…"
          className="flex-1 bg-transparent text-sm text-figma-headerTitle placeholder:text-figma-adminSub outline-none min-w-0"
        />
      </label>
      <select
        name="status"
        defaultValue={defaultStatus}
        aria-label="Filtrer par statut de commande"
        className="h-10 rounded-input border border-figma-tableBorder bg-white px-3 text-sm text-figma-headerTitle shadow-card"
      >
        <option value="">Tous statuts</option>
        <option value="AWAITING_PAYMENT">En attente paiement</option>
        <option value="PAID">Payée</option>
        <option value="DELIVERED">Livrée</option>
        <option value="CANCELLED">Annulée</option>
      </select>
      <button
        type="submit"
        className="px-3 py-2 rounded-lg border border-figma-tableBorder bg-figma-activeMenuText text-white text-sm font-medium hover:opacity-90"
      >
        Filtrer
      </button>
    </form>
  );
}

export function CommandesPagination({
  page,
  pageSize,
  total,
  q,
  status,
}: {
  page: number;
  pageSize: number;
  total: number;
  q: string;
  status: string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1 && total === 0) return null;

  const href = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (status) sp.set("status", status);
    sp.set("page", String(p));
    return `/dashboard/commandes?${sp.toString()}`;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-sm text-figma-adminSub">
      <span>
        {total === 0 ? "Aucune commande" : `${Math.min((page - 1) * pageSize + 1, total)}–${Math.min(page * pageSize, total)} sur ${total}`}
      </span>
      {pages > 1 ? (
        <div className="flex items-center gap-2">
          {page > 1 ? (
            <Link
              href={href(page - 1)}
              className="px-3 py-1.5 rounded-lg border border-figma-tableBorder bg-white font-medium text-figma-headerTitle hover:bg-figma-tableHeader"
            >
              Précédent
            </Link>
          ) : (
            <span className="px-3 py-1.5 opacity-40">Précédent</span>
          )}
          <span className="font-medium text-figma-headerTitle">
            Page {page} / {pages}
          </span>
          {page < pages ? (
            <Link
              href={href(page + 1)}
              className="px-3 py-1.5 rounded-lg border border-figma-tableBorder bg-white font-medium text-figma-headerTitle hover:bg-figma-tableHeader"
            >
              Suivant
            </Link>
          ) : (
            <span className="px-3 py-1.5 opacity-40">Suivant</span>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      className={`shrink-0 ${className ?? ""}`}
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function StatCard({
  value,
  label,
  icon,
  className,
}: {
  value: string;
  label: string;
  icon: ReactNode;
  className: string;
}) {
  return (
    <article
      className={`flex flex-row justify-between items-center py-3 px-4 gap-3 min-h-[100px] flex-1 min-w-[180px] max-w-[270px] rounded-xl shrink-0 ${className}`}
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/60 shrink-0">{icon}</div>
      <div className="flex flex-col items-end">
        <span className="font-extrabold text-2xl leading-tight">{value}</span>
        <span className="font-medium text-sm leading-[19px] opacity-90">{label}</span>
      </div>
    </article>
  );
}

export function PendingIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#C09A00]" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 8v4l2.5 2.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CancelledIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#A31F1F]" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function InProgressIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#1565C0]" aria-hidden>
      <path d="M5 12a7 7 0 1112 4.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M12 8v4l2 1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DeliveredIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#218922]" aria-hidden>
      <path
        d="M5 13l4 4 9-9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  if (status === "en_attente") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#FFF9CA] text-[#C09A00] text-xs font-semibold">
        <PendingIcon />
        En attente
      </span>
    );
  }
  if (status === "annule") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#FFB4B4] text-[#A31F1F] text-xs font-semibold">
        <CancelledIcon />
        Annulé
      </span>
    );
  }
  if (status === "en_cours") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#E3F2FD] text-[#1565C0] text-xs font-semibold">
        <InProgressIcon />
        En cours
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#B4FFB5] text-[#218922] text-xs font-semibold">
      <DeliveredIcon />
      Livré
    </span>
  );
}
