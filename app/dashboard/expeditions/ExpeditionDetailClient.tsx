"use client";

import * as React from "react";
import {
  formatTransport,
  statusLabel,
  SHIPPING_STATUS_OPTIONS,
  mapApiToExpeditionDetail,
  type ExpeditionDetailData,
  type ShippingStatus,
} from "./expedition-detail-data";

const EDIT_FIELDS: { key: keyof ExpeditionDetailData["meta"]; label: string; multiline?: boolean }[] = [
  { key: "senderName", label: "Nom expéditeur" },
  { key: "senderPhone", label: "Tél. expéditeur" },
  { key: "pickupAddress", label: "Adresse récupération", multiline: true },
  { key: "recipientName", label: "Nom destinataire" },
  { key: "recipientPhone", label: "Tél. destinataire" },
  { key: "destinationCountry", label: "Pays destination" },
  { key: "destinationAddress", label: "Adresse destination", multiline: true },
  { key: "weightKg", label: "Poids (kg)" },
  { key: "trackingNumber", label: "N° tracking" },
  { key: "notes", label: "Notes client", multiline: true },
  { key: "adminNotes", label: "Notes internes admin", multiline: true },
];

type ApiDetailResponse = {
  event: {
    id: string;
    email: string | null;
    createdAt: string;
    meta: ExpeditionDetailData["meta"] | null;
    client?: { email?: string; name?: string | null };
  };
  clientEmail?: string | null;
};

export function ExpeditionDetailClient({
  initialData,
  onDataChange,
  onDeleted,
}: {
  initialData: ExpeditionDetailData;
  onDataChange?: (data: ExpeditionDetailData) => void;
  onDeleted?: (id: string) => void;
}) {
  const [data, setData] = React.useState(initialData);
  const [status, setStatus] = React.useState<ShippingStatus>((data.meta.status as ShippingStatus) || "SUBMITTED");
  const [shippedAt, setShippedAt] = React.useState(() => {
    if (!data.meta.shippedAt) return "";
    try {
      return new Date(data.meta.shippedAt).toISOString().slice(0, 10);
    } catch {
      return "";
    }
  });
  const [editForm, setEditForm] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(EDIT_FIELDS.map((f) => [f.key, String(data.meta[f.key] ?? "")])),
  );
  const [commSubject, setCommSubject] = React.useState("");
  const [commMessage, setCommMessage] = React.useState("");
  const [loading, setLoading] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  React.useEffect(() => {
    setData(initialData);
    setStatus((initialData.meta.status as ShippingStatus) || "SUBMITTED");
    setEditForm(Object.fromEntries(EDIT_FIELDS.map((f) => [f.key, String(initialData.meta[f.key] ?? "")])));
  }, [initialData]);

  const id = data.id;
  const photoUrl = `/api/admin/shipping-requests/${encodeURIComponent(id)}/photo`;

  function applyData(next: ExpeditionDetailData) {
    setData(next);
    onDataChange?.(next);
  }

  async function refresh() {
    const res = await fetch(`/api/admin/shipping-requests/${encodeURIComponent(id)}`);
    const json = (await res.json().catch(() => ({}))) as {
      error?: string;
      event?: ApiDetailResponse["event"];
      clientEmail?: string | null;
    };
    if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);
    if (json.event) {
      const next = mapApiToExpeditionDetail({ event: json.event, clientEmail: json.clientEmail });
      applyData(next);
      setStatus((next.meta.status as ShippingStatus) || "SUBMITTED");
      setEditForm(Object.fromEntries(EDIT_FIELDS.map((f) => [f.key, String(next.meta[f.key] ?? "")])));
      if (next.meta.shippedAt) {
        try {
          setShippedAt(new Date(next.meta.shippedAt).toISOString().slice(0, 10));
        } catch {
          setShippedAt("");
        }
      }
    }
  }

  async function patch(body: Record<string, unknown>, actionLabel: string) {
    setError(null);
    setSuccess(null);
    setLoading(actionLabel);
    try {
      const res = await fetch(`/api/admin/shipping-requests/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; event?: ApiDetailResponse["event"] };
      if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);
      if (json.event) {
        const next = mapApiToExpeditionDetail({ event: json.event, clientEmail: data.clientEmail });
        applyData(next);
        setStatus((next.meta.status as ShippingStatus) || "SUBMITTED");
      } else {
        try {
          await refresh();
        } catch {
          const nextMeta = { ...data.meta, ...body, status: (body.status as string) || data.meta.status };
          applyData({ ...data, meta: nextMeta });
        }
      }
      setSuccess(`${actionLabel} enregistré.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(null);
    }
  }

  async function approveZoho() {
    setError(null);
    setSuccess(null);
    setLoading("Validation facture Zoho");
    try {
      const res = await fetch(`/api/admin/shipping-requests/${encodeURIComponent(id)}/zoho/approve`, {
        method: "POST",
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);
      try {
        await refresh();
      } catch {
        /* garde les données locales */
      }
      setSuccess("Facture Zoho validée (brouillon → envoyée).");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(null);
    }
  }

  async function sendCommunication() {
    if (!commSubject.trim() || !commMessage.trim()) {
      setError("Sujet et message requis.");
      return;
    }
    setError(null);
    setSuccess(null);
    setLoading("Envoi communication");
    try {
      const res = await fetch(`/api/admin/shipping-requests/${encodeURIComponent(id)}/communicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: commSubject, message: commMessage }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; warning?: string };
      if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);
      try {
        await refresh();
      } catch {
        /* ignore */
      }
      setCommSubject("");
      setCommMessage("");
      setSuccess(json.warning || "Communication envoyée au client.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(null);
    }
  }

  async function generateLabel() {
    setError(null);
    setSuccess(null);
    setLoading("Génération étiquette");
    try {
      const res = await fetch(`/api/admin/shipping-requests/${encodeURIComponent(id)}/label`, { method: "POST" });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);
      try {
        await refresh();
      } catch {
        /* ignore */
      }
      setSuccess("Étiquette générée.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(null);
    }
  }

  async function deleteRequest() {
    setError(null);
    setSuccess(null);
    setLoading("Suppression");
    try {
      const res = await fetch(`/api/admin/shipping-requests/${encodeURIComponent(id)}`, { method: "DELETE" });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`);
      setShowDeleteConfirm(false);
      onDeleted?.(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(null);
    }
  }

  const communications = data.meta.communications || [];

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
      ) : null}
      {success ? (
        <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">{success}</p>
      ) : null}

      <section className="border border-figma-tableBorder rounded-card bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-figma-adminSub">Demande #{data.id.slice(0, 8)}</p>
            <p className="text-lg font-semibold text-figma-headerTitle">{statusLabel(data.meta.status)}</p>
            <p className="text-sm text-figma-adminSub mt-1">
              {formatTransport(data.meta.transportMode)} · {new Date(data.createdAt).toLocaleString("fr-FR")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ShippingStatus)}
              className="rounded-lg border border-figma-tableBorder px-3 py-2 text-sm"
            >
              {SHIPPING_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!!loading}
              onClick={() => void patch({ status }, "Statut")}
              className="rounded-lg bg-figma-headerTitle text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              Mettre à jour
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="border border-figma-tableBorder rounded-card bg-white p-4">
          <h2 className="text-sm font-semibold text-figma-headerTitle mb-3">Facture Zoho Books</h2>
          <dl className="grid gap-2 text-sm mb-3">
            <div className="flex justify-between gap-4">
              <dt className="text-figma-adminSub">Brouillon</dt>
              <dd className="font-mono text-xs truncate max-w-[180px]">{data.meta.zohoDraftId || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-figma-adminSub">Facture validée</dt>
              <dd className="font-mono text-xs truncate max-w-[180px]">{data.meta.zohoInvoiceId || "—"}</dd>
            </div>
          </dl>
          <button
            type="button"
            disabled={!!loading || data.meta.invoiceStatus === "APPROVED"}
            onClick={() => void approveZoho()}
            className="rounded-lg border border-figma-tableBorder px-3 py-2 text-sm font-medium hover:bg-figma-tableHeader disabled:opacity-50"
          >
            Valider la facture brouillon
          </button>
        </section>

        <section className="border border-figma-tableBorder rounded-card bg-white p-4">
          <h2 className="text-sm font-semibold text-figma-headerTitle mb-1">Date d&apos;expédition prévue</h2>
          <p className="text-xs text-figma-adminSub mb-3">
            Planifiez une date sans changer le statut. Passez manuellement à « Expédiée » le jour de l&apos;envoi.
          </p>
          <input
            type="date"
            value={shippedAt}
            onChange={(e) => setShippedAt(e.target.value)}
            className="w-full rounded-lg border border-figma-tableBorder px-3 py-2 text-sm mb-3"
          />
          <button
            type="button"
            disabled={!!loading || !shippedAt}
            onClick={() => void patch({ shippedAt: `${shippedAt}T12:00:00.000Z` }, "Date d'expédition")}
            className="rounded-lg border border-figma-tableBorder px-3 py-2 text-sm font-medium hover:bg-figma-tableHeader disabled:opacity-50"
          >
            Enregistrer la date
          </button>
        </section>
      </div>

      <section className="border border-figma-tableBorder rounded-card bg-white p-4">
        <h2 className="text-sm font-semibold text-figma-headerTitle mb-3">Corriger les données</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {EDIT_FIELDS.map((f) => (
            <label key={f.key} className={`grid gap-1 text-sm ${f.multiline ? "md:col-span-2" : ""}`}>
              <span className="text-figma-adminSub">{f.label}</span>
              {f.multiline ? (
                <textarea
                  rows={2}
                  value={editForm[f.key] || ""}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  className="rounded-lg border border-figma-tableBorder px-3 py-2"
                />
              ) : (
                <input
                  value={editForm[f.key] || ""}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  className="rounded-lg border border-figma-tableBorder px-3 py-2"
                />
              )}
            </label>
          ))}
        </div>
        <button
          type="button"
          disabled={!!loading}
          onClick={() => void patch(editForm, "Données")}
          className="mt-3 rounded-lg bg-figma-headerTitle text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          Enregistrer les corrections
        </button>
      </section>

      <section className="border border-figma-tableBorder rounded-card bg-white p-4">
        <h2 className="text-sm font-semibold text-figma-headerTitle mb-3">Communication client</h2>
        <p className="text-xs text-figma-adminSub mb-2">
          {data.clientEmail || data.email || "—"}
          {data.clientName ? ` · ${data.clientName}` : ""}
        </p>
        <div className="grid gap-2 mb-3">
          <input
            placeholder="Sujet"
            value={commSubject}
            onChange={(e) => setCommSubject(e.target.value)}
            className="rounded-lg border border-figma-tableBorder px-3 py-2 text-sm"
          />
          <textarea
            rows={3}
            placeholder="Message…"
            value={commMessage}
            onChange={(e) => setCommMessage(e.target.value)}
            className="rounded-lg border border-figma-tableBorder px-3 py-2 text-sm"
          />
        </div>
        <button
          type="button"
          disabled={!!loading}
          onClick={() => void sendCommunication()}
          className="rounded-lg border border-figma-tableBorder px-3 py-2 text-sm font-medium hover:bg-figma-tableHeader disabled:opacity-50"
        >
          Envoyer
        </button>
      </section>

      <section className="border border-figma-tableBorder rounded-card bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="text-sm font-semibold text-figma-headerTitle">Étiquette</h2>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!!loading}
              onClick={() => void generateLabel()}
              className="rounded-lg border border-figma-tableBorder px-3 py-2 text-xs font-medium hover:bg-figma-tableHeader disabled:opacity-50"
            >
              Générer
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-lg bg-figma-headerTitle text-white px-3 py-2 text-xs font-medium"
            >
              Imprimer
            </button>
          </div>
        </div>
        <div className="rounded-lg border border-dashed border-figma-tableBorder p-4 bg-figma-tableHeader/30 text-sm">
          <p className="font-bold">{data.meta.recipientName || "Destinataire"}</p>
          <p>{data.meta.destinationAddress}</p>
          <p>{data.meta.destinationCountry}</p>
          <p className="mt-2 font-mono text-xs">
            {data.meta.labelTrackingNumber || data.meta.trackingNumber || "—"}
          </p>
        </div>
      </section>

      {data.meta.photoPath || data.meta.photoBytes ? (
        <section className="border border-figma-tableBorder rounded-card bg-white p-4">
          <h2 className="text-sm font-semibold text-figma-headerTitle mb-3">Photo colis</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrl} alt="Colis" className="max-h-48 rounded-lg border object-contain" />
        </section>
      ) : null}

      <section className="border border-red-200 rounded-card bg-red-50/50 p-4">
        <h2 className="text-sm font-semibold text-red-900">Zone sensible</h2>
        <p className="mt-1 text-sm text-red-800/90">
          Supprime définitivement cette demande d&apos;expédition (données et photo associées).
        </p>
        <button
          type="button"
          disabled={!!loading}
          onClick={() => setShowDeleteConfirm(true)}
          className="mt-3 rounded-lg bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-60"
        >
          Supprimer la demande
        </button>
      </section>

      {showDeleteConfirm ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div
            className="w-full max-w-md rounded-card bg-white shadow-cardHover px-6 py-5"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-expedition-title"
          >
            <h3 id="delete-expedition-title" className="text-base font-semibold text-figma-headerTitle">
              Supprimer cette demande ?
            </h3>
            <p className="mt-2 text-sm text-figma-adminSub leading-relaxed">
              La demande <strong>#{data.id.slice(0, 8)}</strong>
              {data.meta.recipientName ? ` (${data.meta.recipientName})` : ""} sera supprimée définitivement.
              Cette action est irréversible.
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={!!loading}
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-figma-tableBorder px-4 py-2 text-sm font-medium hover:bg-figma-tableHeader disabled:opacity-60"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={!!loading}
                onClick={() => void deleteRequest()}
                className="rounded-lg bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-60"
              >
                {loading === "Suppression" ? "Suppression…" : "Confirmer la suppression"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {loading ? <p className="text-xs text-figma-adminSub">{loading}…</p> : null}
    </div>
  );
}
