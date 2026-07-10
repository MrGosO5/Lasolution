"use client";

import * as React from "react";
import { ExpeditionManageModal } from "./ExpeditionManageModal";
import {
  DEFAULT_SHIPPING_STATUS,
  formatTransport,
  mapListEventToDetail,
  statusSelectOptions,
  type ExpeditionDetailData,
} from "./expedition-detail-data";
import { openExpeditionLabel } from "./expedition-label";

export type ShippingRequestRow = {
  id: string;
  email: string | null;
  createdAt: string;
  meta: {
    transportMode?: string | null;
    trackingNumber?: string | null;
    recipientName?: string | null;
    recipientPhone?: string | null;
    destinationCountry?: string | null;
    destinationAddress?: string | null;
    weightKg?: string | null;
    notes?: string | null;
    photoBytes?: number | null;
    status?: string | null;
    [key: string]: unknown;
  } | null;
};

function safeString(v: unknown): string {
  if (v == null) return "";
  return typeof v === "string" ? v : String(v);
}

const fieldInputClass =
  "w-full min-w-0 rounded-lg border border-figma-tableBorder bg-white px-2 py-1.5 text-sm text-figma-headerTitle focus:outline-none focus:ring-2 focus:ring-figma-activeMenuText/25 disabled:opacity-60";

export function ExpeditionsTableClient({ initialRows }: { initialRows: ShippingRequestRow[] }) {
  const [rows, setRows] = React.useState(initialRows);
  const [selected, setSelected] = React.useState<ExpeditionDetailData | null>(null);
  const [savingKey, setSavingKey] = React.useState<string | null>(null);
  const [rowErrors, setRowErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  function openManage(row: ShippingRequestRow) {
    setSelected(mapListEventToDetail(row));
  }

  function syncRow(data: ExpeditionDetailData) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === data.id
          ? {
              ...r,
              email: data.email,
              meta: { ...(r.meta || {}), ...data.meta },
            }
          : r,
      ),
    );
    setSelected(data);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
    setSelected(null);
  }

  async function patchRowMeta(rowId: string, body: Record<string, unknown>, fieldKey: string) {
    const saveKey = `${rowId}:${fieldKey}`;
    setSavingKey(saveKey);
    setRowErrors((prev) => {
      const next = { ...prev };
      delete next[rowId];
      return next;
    });

    try {
      const res = await fetch(`/api/admin/shipping-requests/${encodeURIComponent(rowId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        event?: ShippingRequestRow;
      };
      if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);

      if (json.event) {
        const updated = json.event;
        setRows((prev) =>
          prev.map((r) =>
            r.id === rowId
              ? {
                  ...r,
                  email: updated.email ?? r.email,
                  meta: { ...(r.meta || {}), ...(updated.meta || {}) },
                }
              : r,
          ),
        );
        if (selected?.id === rowId) {
          setSelected(mapListEventToDetail(updated));
        }
      }
    } catch (e) {
      setRowErrors((prev) => ({
        ...prev,
        [rowId]: e instanceof Error ? e.message : String(e),
      }));
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <>
      <div className="border border-figma-tableBorder rounded-card overflow-hidden bg-white shadow-card">
        <table className="w-full min-w-[1080px]">
          <thead>
            <tr className="bg-figma-tableHeader border-b border-figma-tableBorder">
              <th className="text-left px-4 py-3 text-xs font-semibold text-figma-headerTitle min-w-[220px]">
                Statut
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-figma-headerTitle">Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-figma-headerTitle">Mode</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-figma-headerTitle">Destination</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-figma-headerTitle">Contact</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-figma-headerTitle min-w-[88px]">
                Poids (kg)
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-figma-headerTitle">Tracking</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-figma-headerTitle">Photo</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-figma-headerTitle">Remarques</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-figma-headerTitle">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((ev) => {
                const meta = ev.meta || {};
                const dest = [safeString(meta.destinationCountry), safeString(meta.destinationAddress)]
                  .filter(Boolean)
                  .join(" · ");
                const contact = [safeString(meta.recipientName), safeString(meta.recipientPhone)].filter(Boolean).join(" — ");
                const photoBytes = meta.photoBytes != null ? `${meta.photoBytes} octets` : "—";
                const notes = safeString(meta.notes).slice(0, 80);
                const statusValue = safeString(meta.status || DEFAULT_SHIPPING_STATUS).toUpperCase();
                const weightValue = safeString(meta.weightKg);
                const statusSaving = savingKey === `${ev.id}:status`;
                const weightSaving = savingKey === `${ev.id}:weight`;
                const rowError = rowErrors[ev.id];

                return (
                  <tr
                    key={ev.id}
                    className="border-b border-figma-tableRowBorder last:border-0 bg-white hover:bg-figma-tableRowHover transition-colors duration-fast align-top"
                  >
                    <td className="px-4 py-3 text-sm">
                      <select
                        value={statusValue}
                        disabled={statusSaving}
                        aria-label={`Statut de la demande ${ev.id.slice(0, 8)}`}
                        className={`${fieldInputClass} min-w-[200px] max-w-[240px]`}
                        onChange={(e) => {
                          const next = e.target.value;
                          if (next === statusValue) return;
                          void patchRowMeta(ev.id, { status: next }, "status");
                        }}
                      >
                        {statusSelectOptions(meta.status).map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      {statusSaving ? <p className="mt-1 text-xs text-figma-adminSub">Enregistrement…</p> : null}
                    </td>
                    <td className="px-4 py-3 text-sm text-figma-headerTitle">
                      {new Date(ev.createdAt).toLocaleString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-sm text-figma-headerTitle">{formatTransport(meta.transportMode)}</td>
                    <td className="px-4 py-3 text-sm text-figma-headerTitle">{dest || "—"}</td>
                    <td className="px-4 py-3 text-sm text-figma-headerTitle">{contact || "—"}</td>
                    <td className="px-4 py-3 text-sm">
                      <input
                        key={`${ev.id}-weight-${weightValue}`}
                        type="text"
                        inputMode="decimal"
                        defaultValue={weightValue}
                        disabled={weightSaving}
                        aria-label={`Poids en kg de la demande ${ev.id.slice(0, 8)}`}
                        placeholder="—"
                        className={`${fieldInputClass} w-20`}
                        onBlur={(e) => {
                          const next = e.target.value.trim();
                          const prev = weightValue.trim();
                          if (next === prev) return;
                          void patchRowMeta(ev.id, { weightKg: next || null }, "weight");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.currentTarget.blur();
                        }}
                      />
                      {weightSaving ? <p className="mt-1 text-xs text-figma-adminSub">Enregistrement…</p> : null}
                    </td>
                    <td className="px-4 py-3 text-sm text-figma-headerTitle">{safeString(meta.trackingNumber) || "—"}</td>
                    <td className="px-4 py-3 text-sm text-figma-headerTitle">{photoBytes}</td>
                    <td className="px-4 py-3 text-sm text-figma-headerTitle">{notes || "—"}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => openManage(ev)}
                          className="text-left font-semibold text-figma-headerTitle hover:underline"
                        >
                          Gérer
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRowErrors((prev) => {
                              const next = { ...prev };
                              delete next[ev.id];
                              return next;
                            });
                            void openExpeditionLabel(mapListEventToDetail(ev)).catch((err) =>
                              setRowErrors((prev) => ({
                                ...prev,
                                [ev.id]: err instanceof Error ? err.message : String(err),
                              })),
                            );
                          }}
                          className="text-left text-xs font-medium text-figma-activeMenuText hover:underline"
                        >
                          Étiquette PDF
                        </button>
                      </div>
                      {rowError ? (
                        <p className="mt-1 text-xs text-red-600 max-w-[140px] leading-snug" title={rowError}>
                          {rowError}
                        </p>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="px-4 py-6 text-sm text-figma-adminSub" colSpan={10}>
                  Aucune demande trouvée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected ? (
        <ExpeditionManageModal
          initialData={selected}
          onClose={() => setSelected(null)}
          onDataChange={syncRow}
          onDeleted={removeRow}
        />
      ) : null}
    </>
  );
}
