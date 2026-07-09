"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  buildExpeditionTimeline,
  clientStatusLabel,
  formatTransportMode,
  shippedAtClientLabel,
  statusTone,
} from "@/lib/shipping-expedition-client";
import type { MesExpeditionRow } from "./MesExpeditionsTable";

export function MesExpeditionSuiviModal({ row, onClose }: { row: MesExpeditionRow; onClose: () => void }) {
  const [mounted, setMounted] = React.useState(false);
  const timeline = React.useMemo(() => buildExpeditionTimeline(row.createdAt, row.meta), [row]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const destLine = [row.destinationCountry, row.destinationAddress].filter(Boolean).join(" · ");
  const recipient = [row.recipientName, row.recipientPhone].filter(Boolean).join(" · ");

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="suivi-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-black/5 px-5 py-4 shrink-0">
          <div className="min-w-0">
            <p id="suivi-modal-title" className="text-lg font-semibold text-gray-900">
              Suivi #{row.id.slice(0, 8)}
            </p>
            <p className="text-sm text-gray-600 mt-0.5">
              {formatTransportMode(row.transportMode)}
              {destLine ? ` · ${destLine}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 shrink-0"
            aria-label="Fermer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-4 flex-1 space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Statut actuel</p>
            <p className="mt-2">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusTone(row.status)}`}>
                {clientStatusLabel(row.status)}
              </span>
            </p>
          </div>

          {(recipient || row.weightKg) && (
            <div className="grid gap-2 text-sm text-gray-700">
              {recipient ? (
                <p>
                  <span className="font-medium text-gray-900">Destinataire · </span>
                  {recipient}
                </p>
              ) : null}
              {row.weightKg ? <p>Poids déclaré : {row.weightKg} kg</p> : null}
            </div>
          )}

          {row.trackingNumber || row.shippedAt ? (
            <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950 space-y-1">
              {row.trackingNumber ? (
                <p>
                  <span className="font-medium">N° de suivi · </span>
                  <span className="font-mono break-all">{row.trackingNumber}</span>
                </p>
              ) : null}
              {row.shippedAt ? (
                <p>
                  {shippedAtClientLabel(row.status)}{" "}
                  {new Date(row.shippedAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              ) : null}
            </div>
          ) : null}

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Évolutions</h3>
            <ol className="mt-3 grid gap-4">
              {timeline.map((entry, idx) => (
                <li key={entry.id} className="relative pl-6">
                  {idx < timeline.length - 1 ? (
                    <span className="absolute left-[7px] top-3 bottom-[-16px] w-px bg-gray-200" aria-hidden />
                  ) : null}
                  <span
                    className={`absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full ring-2 ring-white ${
                      entry.kind === "message"
                        ? "bg-[var(--logo-red)]"
                        : entry.kind === "shipped"
                          ? "bg-sky-500"
                          : entry.kind === "created"
                            ? "bg-emerald-500"
                            : "bg-gray-400"
                    }`}
                    aria-hidden
                  />
                  <p className="text-xs text-gray-500">
                    {new Date(entry.at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{entry.title}</p>
                  {entry.body ? (
                    <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{entry.body}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
