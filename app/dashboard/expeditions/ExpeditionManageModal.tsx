"use client";

import * as React from "react";
import { ExpeditionDetailClient } from "./ExpeditionDetailClient";
import { mapApiToExpeditionDetail, type ExpeditionDetailData } from "./expedition-detail-data";

export function ExpeditionManageModal({
  initialData,
  onClose,
  onDataChange,
  onDeleted,
}: {
  initialData: ExpeditionDetailData;
  onClose: () => void;
  onDataChange?: (data: ExpeditionDetailData) => void;
  onDeleted?: (id: string) => void;
}) {
  const [data, setData] = React.useState(initialData);
  const [loading, setLoading] = React.useState(true);
  const [loadNote, setLoadNote] = React.useState<string | null>(null);

  React.useEffect(() => {
    setData(initialData);
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setLoadNote(null);
      try {
        const res = await fetch(`/api/admin/shipping-requests/${encodeURIComponent(initialData.id)}`);
        const json = (await res.json().catch(() => ({}))) as {
          error?: string;
          event?: Parameters<typeof mapApiToExpeditionDetail>[0]["event"];
          clientEmail?: string | null;
        };
        if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);
        if (!cancelled && json.event) {
          setData(mapApiToExpeditionDetail({ event: json.event, clientEmail: json.clientEmail }));
        }
      } catch (e) {
        if (!cancelled) {
          setLoadNote(
            e instanceof Error
              ? `${e.message} — affichage des données de la liste.`
              : "Détail API indisponible — affichage des données de la liste.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialData]);

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

  function handleDataChange(next: ExpeditionDetailData) {
    setData(next);
    onDataChange?.(next);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="expedition-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-figma-tableBorder px-5 py-4 shrink-0">
          <div>
            <p id="expedition-modal-title" className="text-lg font-semibold text-figma-headerTitle">
              Gérer l&apos;expédition #{data.id.slice(0, 8)}
            </p>
            <p className="text-sm text-figma-adminSub mt-0.5">
              {data.meta.recipientName || "Destinataire"} · {data.meta.destinationCountry || "—"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-figma-adminSub hover:bg-figma-tableHeader hover:text-figma-headerTitle"
            aria-label="Fermer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-4 flex-1">
          {loading ? (
            <p className="text-sm text-figma-adminSub py-8 text-center">Chargement du détail…</p>
          ) : (
            <>
              {loadNote ? (
                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                  {loadNote}
                </p>
              ) : null}
              <ExpeditionDetailClient
                initialData={data}
                onDataChange={handleDataChange}
                onDeleted={(deletedId) => {
                  onDeleted?.(deletedId);
                  onClose();
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
