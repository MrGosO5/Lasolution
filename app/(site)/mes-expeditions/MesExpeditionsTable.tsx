"use client";

import { useMemo, useState } from "react";

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
};

function modeLabel(m: string) {
  const x = String(m || "").toUpperCase();
  if (x === "AIR") return "Aérien";
  if (x === "SEA") return "Maritime";
  return "—";
}

export function MesExpeditionsTable({ rows }: { rows: MesExpeditionRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const idShort = r.id.slice(0, 8).toLowerCase();
      const modeFr = modeLabel(r.transportMode).toLowerCase();
      const haystack = [
        r.id,
        idShort,
        r.transportMode,
        modeFr,
        r.destinationCountry,
        r.destinationAddress,
        r.recipientName,
        r.recipientPhone,
        r.weightKg,
        r.trackingNumber,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, query]);

  return (
    <div className="card overflow-hidden">
      <div className="p-4 md:p-5 bg-black/[0.02] border-b border-black/5">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <label className="grid gap-2">
            <span className="text-xs font-semibold tracking-wide text-gray-600 uppercase">Recherche</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Référence, destination, destinataire, tracking…"
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
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[1fr_0.8fr_1.1fr_1fr_0.8fr_0.8fr_0.9fr] gap-2 px-5 py-3 text-xs font-semibold text-gray-600 uppercase bg-black/[0.02] border-b border-black/5">
              <span>Référence</span>
              <span>Mode</span>
              <span>Destination</span>
              <span>Destinataire</span>
              <span>Date</span>
              <span>Poids</span>
              <span>Tracking</span>
            </div>
            {filtered.map((r) => {
              const date = new Date(r.createdAt);
              const dest = [r.destinationCountry, r.destinationAddress].filter(Boolean).join(" · ");
              const rec = [r.recipientName, r.recipientPhone].filter(Boolean).join(" — ");
              return (
                <div
                  key={r.id}
                  className="grid grid-cols-[1fr_0.8fr_1.1fr_1fr_0.8fr_0.8fr_0.9fr] gap-2 px-5 py-4 text-sm border-b border-black/5 hover:bg-black/[0.02]"
                >
                  <span className="font-semibold text-gray-900">#{r.id.slice(0, 8)}</span>
                  <span className="text-gray-700">{modeLabel(r.transportMode)}</span>
                  <span className="text-gray-700">{dest || "—"}</span>
                  <span className="text-gray-700">{rec || "—"}</span>
                  <span className="text-gray-700">{date.toLocaleDateString("fr-FR")}</span>
                  <span className="text-gray-700">{r.weightKg ? `${r.weightKg} kg` : "—"}</span>
                  <span className="text-gray-700">{r.trackingNumber || "—"}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
