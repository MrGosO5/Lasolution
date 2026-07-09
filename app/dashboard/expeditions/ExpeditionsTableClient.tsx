"use client";

import * as React from "react";
import { ExpeditionManageModal } from "./ExpeditionManageModal";
import { formatTransport, mapListEventToDetail, statusLabel, type ExpeditionDetailData } from "./expedition-detail-data";

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

export function ExpeditionsTableClient({ initialRows }: { initialRows: ShippingRequestRow[] }) {
  const [rows, setRows] = React.useState(initialRows);
  const [selected, setSelected] = React.useState<ExpeditionDetailData | null>(null);

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

  return (
    <>
      <div className="border border-figma-tableBorder rounded-card overflow-hidden bg-white shadow-card">
        <table className="w-full min-w-[980px]">
          <thead>
            <tr className="bg-figma-tableHeader border-b border-figma-tableBorder">
              <th className="text-left px-4 py-3 text-xs font-semibold text-figma-headerTitle">Statut</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-figma-headerTitle">Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-figma-headerTitle">Mode</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-figma-headerTitle">Destination</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-figma-headerTitle">Contact</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-figma-headerTitle">Poids</th>
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

                return (
                  <tr
                    key={ev.id}
                    className="border-b border-figma-tableRowBorder last:border-0 bg-white hover:bg-figma-tableRowHover transition-colors duration-fast"
                  >
                    <td className="px-4 py-3 text-sm text-figma-headerTitle">{statusLabel(meta.status)}</td>
                    <td className="px-4 py-3 text-sm text-figma-headerTitle">
                      {new Date(ev.createdAt).toLocaleString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-sm text-figma-headerTitle">{formatTransport(meta.transportMode)}</td>
                    <td className="px-4 py-3 text-sm text-figma-headerTitle">{dest || "—"}</td>
                    <td className="px-4 py-3 text-sm text-figma-headerTitle">{contact || "—"}</td>
                    <td className="px-4 py-3 text-sm text-figma-headerTitle">{safeString(meta.weightKg) || "—"}</td>
                    <td className="px-4 py-3 text-sm text-figma-headerTitle">{safeString(meta.trackingNumber) || "—"}</td>
                    <td className="px-4 py-3 text-sm text-figma-headerTitle">{photoBytes}</td>
                    <td className="px-4 py-3 text-sm text-figma-headerTitle">{notes || "—"}</td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        type="button"
                        onClick={() => openManage(ev)}
                        className="font-semibold text-figma-headerTitle hover:underline"
                      >
                        Gérer
                      </button>
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
