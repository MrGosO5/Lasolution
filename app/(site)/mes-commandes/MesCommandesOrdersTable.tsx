"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type MesCommandeRow = {
  id: string;
  status: string;
  currency: string;
  createdAt: string;
  lines: { description: string; quantity: number; unitPrice: string; currency: string }[];
};

function statusLabel(status: string) {
  const s = String(status || "").toUpperCase();
  const map: Record<string, string> = {
    AWAITING_PAYMENT: "En attente de paiement",
    PAID: "Payée",
    DELIVERED: "Livrée",
    CANCELLED: "Annulée",
  };
  return map[s] || status;
}

export function MesCommandesOrdersTable({ orders }: { orders: MesCommandeRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
      const idShort = o.id.slice(0, 8).toLowerCase();
      const statusFr = statusLabel(o.status).toLowerCase();
      const statusRaw = o.status.toLowerCase();
      const haystack = (o.lines || [])
        .map((l) => `${l.description} ${l.quantity}`)
        .join(" ")
        .toLowerCase();
      return (
        o.id.toLowerCase().includes(q) ||
        idShort.includes(q) ||
        statusRaw.includes(q) ||
        statusFr.includes(q) ||
        haystack.includes(q)
      );
    });
  }, [orders, query]);

  return (
    <div className="card overflow-hidden">
      <div className="p-4 md:p-5 bg-black/[0.02] border-b border-black/5">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <label className="grid gap-2">
            <span className="text-xs font-semibold tracking-wide text-gray-600 uppercase">Recherche</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Référence, article, statut…"
              className="h-11 w-full rounded-xl bg-white/80 ring-1 ring-black/10 px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[rgb(214_54_78/0.25)]"
            />
          </label>
          <p className="text-xs text-gray-500 md:text-right md:pb-2">
            {filtered.length} / {orders.length} commande(s)
          </p>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-6 md:p-7">
          <p className="text-sm font-semibold text-gray-900">Aucun résultat</p>
          <p className="mt-1 text-sm text-gray-600">Modifiez ou effacez votre recherche.</p>
        </div>
      ) : (
        <div className="grid overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-[1.4fr_1fr_1fr_0.9fr_0.7fr] gap-2 px-5 py-3 text-xs font-semibold text-gray-600 uppercase bg-black/[0.02] border-b border-black/5">
              <span>Référence</span>
              <span>Articles</span>
              <span>Date</span>
              <span>Statut</span>
              <span>Action</span>
            </div>
            {filtered.map((o) => {
              const date = new Date(o.createdAt);
              const products = o.lines?.map((l) => `${l.description} ×${l.quantity}`).slice(0, 2).join(", ");
              const productsMore = (o.lines?.length ?? 0) > 2 ? ` +${(o.lines?.length ?? 0) - 2}` : "";
              return (
                <div
                  key={o.id}
                  className="grid grid-cols-[1.4fr_1fr_1fr_0.9fr_0.7fr] gap-2 px-5 py-4 text-sm border-b border-black/5 hover:bg-black/[0.02]"
                >
                  <span className="font-semibold text-gray-900">#{o.id.slice(0, 8)}</span>
                  <span className="text-gray-700">{products ? `${products}${productsMore}` : "—"}</span>
                  <span className="text-gray-700">{date.toLocaleDateString("fr-FR")}</span>
                  <span className="text-gray-700">{statusLabel(o.status)}</span>
                  <Link className="text-gray-900 font-semibold hover:underline" href={`/mes-commandes/${o.id}`}>
                    Détails
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
