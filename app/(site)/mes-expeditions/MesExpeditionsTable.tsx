"use client";

import * as React from "react";
import { clientStatusLabel, formatTransportMode, statusTone } from "@/lib/shipping-expedition-client";
import { MesExpeditionSuiviModal } from "./MesExpeditionSuiviModal";
import type { ClientExpeditionMeta } from "@/lib/shipping-expedition-client";
import type { OrderTestimonialData } from "@/app/site/components/OrderTestimonialBlock";

export type MesExpeditionRow = {
  id: string;
  createdAt: string;
  transportMode: string;
  destinationCountry: string;
  destinationAddress: string;
  recipientName: string;
  recipientPhone: string;
  weightKg: string;
  trackingNumber: string;
  status: string;
  shippedAt: string | null;
  meta: ClientExpeditionMeta;
  testimonial?: OrderTestimonialData | null;
};

export function MesExpeditionsTable({ rows }: { rows: MesExpeditionRow[] }) {
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<MesExpeditionRow | null>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const statusFr = clientStatusLabel(r.status).toLowerCase();
      const haystack = [
        r.id,
        r.id.slice(0, 8),
        r.transportMode,
        formatTransportMode(r.transportMode),
        r.destinationCountry,
        r.destinationAddress,
        r.recipientName,
        r.trackingNumber,
        r.weightKg,
        statusFr,
        r.status,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, query]);

  return (
    <>
      <div className="card overflow-hidden">
        <div className="p-4 md:p-5 bg-black/[0.02] border-b border-black/5">
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <label className="grid gap-2">
              <span className="text-xs font-semibold tracking-wide text-gray-600 uppercase">Recherche</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Référence, statut, poids, destination…"
                className="h-11 w-full rounded-xl bg-white/80 ring-1 ring-black/10 px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[rgb(214_54_78/0.25)]"
              />
            </label>
            <p className="text-xs text-gray-500 md:text-right md:pb-2">
              {filtered.length} / {rows.length} demande(s)
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
            <div className="min-w-[960px]">
              <div className="grid grid-cols-[1fr_1fr_0.7fr_0.7fr_1fr_1fr_0.8fr_0.7fr] gap-2 px-5 py-3 text-xs font-semibold text-gray-600 uppercase bg-black/[0.02] border-b border-black/5">
                <span>Référence</span>
                <span>Statut</span>
                <span>Mode</span>
                <span>Poids</span>
                <span>Destination</span>
                <span>Destinataire</span>
                <span>Date</span>
                <span>Suivi</span>
              </div>
              {filtered.map((r) => {
                const date = new Date(r.createdAt);
                const dest = [r.destinationCountry, r.destinationAddress].filter(Boolean).join(" · ");
                const rec = [r.recipientName, r.recipientPhone].filter(Boolean).join(" — ");
                return (
                  <div
                    key={r.id}
                    className="grid grid-cols-[1fr_1fr_0.7fr_0.7fr_1fr_1fr_0.8fr_0.7fr] gap-2 px-5 py-4 text-sm border-b border-black/5 hover:bg-black/[0.02] items-center"
                  >
                    <span className="font-semibold text-gray-900">#{r.id.slice(0, 8)}</span>
                    <span>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${statusTone(r.status)}`}
                      >
                        {clientStatusLabel(r.status)}
                      </span>
                    </span>
                    <span className="text-gray-700">{formatTransportMode(r.transportMode)}</span>
                    <span className="text-gray-700">{r.weightKg ? `${r.weightKg} kg` : "—"}</span>
                    <span className="text-gray-700">{dest || "—"}</span>
                    <span className="text-gray-700">{rec || "—"}</span>
                    <span className="text-gray-700">{date.toLocaleDateString("fr-FR")}</span>
                    <button
                      type="button"
                      onClick={() => setSelected(r)}
                      className="text-left font-semibold text-[var(--logo-red-dark)] hover:underline"
                    >
                      Voir
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {selected ? <MesExpeditionSuiviModal row={selected} onClose={() => setSelected(null)} /> : null}
    </>
  );
}
