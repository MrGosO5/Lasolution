"use client";

import * as React from "react";
import { dashboardUiStatusToApi, mapApiOrderToDetailData, type OrderDetailData, type OrderStatus } from "../order-detail-data";

export type { OrderDetailData, OrderStatus } from "../order-detail-data";

const ORDER_ACTIONS = [
  { value: "", label: "Choisir une action" },
  { value: "attente_paiement", label: "Remettre en attente de paiement" },
  { value: "valider", label: "Valider la commande" },
  { value: "annuler", label: "Annuler la commande" },
  { value: "en_cours", label: "Marquer en cours" },
  { value: "livre", label: "Marquer livré" },
] as const;

export function CommandeDetailClient({
  initialData,
}: {
  initialData: OrderDetailData;
}) {
  const [data, setData] = React.useState(initialData);
  const [selectedParcelId, setSelectedParcelId] = React.useState<string>(() => data.parcels?.[0]?.id || "");
  const [poidsRecupere, setPoidsRecupere] = React.useState("");
  const [dateExpedition, setDateExpedition] = React.useState("");
  const [actionSelect, setActionSelect] = React.useState("");
  const [showConfirmStatus, setShowConfirmStatus] = React.useState(false);
  const [pendingStatus, setPendingStatus] = React.useState<OrderStatus | null>(null);
  const [editingClient, setEditingClient] = React.useState(false);
  const [patchLoading, setPatchLoading] = React.useState(false);
  const [patchError, setPatchError] = React.useState<string | null>(null);
  const [parcelLoading, setParcelLoading] = React.useState(false);
  const [parcelError, setParcelError] = React.useState<string | null>(null);
  const [refreshLoading, setRefreshLoading] = React.useState(false);

  const selectedParcel = React.useMemo(() => {
    const p = data.parcels?.find((x) => x.id === selectedParcelId);
    return p || data.parcels?.[0] || null;
  }, [data.parcels, selectedParcelId]);

  React.useEffect(() => {
    // Si on change de colis (ou chargement initial), préremplir le poids
    if (selectedParcel?.weightKg != null) {
      setPoidsRecupere(String(selectedParcel.weightKg || ""));
    } else {
      setPoidsRecupere("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedParcelId, selectedParcel?.id]);

  const handleActionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setActionSelect(value);
    if (value === "attente_paiement") {
      setPendingStatus("en_attente");
      setShowConfirmStatus(true);
    } else if (value === "valider") {
      setPendingStatus("en_cours");
      setShowConfirmStatus(true);
    } else if (value === "annuler") {
      setPendingStatus("annule");
      setShowConfirmStatus(true);
    } else if (value === "en_cours") {
      setPendingStatus("en_cours");
      setShowConfirmStatus(true);
    } else if (value === "livre") {
      setPendingStatus("livre");
      setShowConfirmStatus(true);
    }
  };

  const confirmStatusChange = async () => {
    if (pendingStatus === null) return;
    setPatchError(null);
    setPatchLoading(true);
    try {
      const apiStatus = dashboardUiStatusToApi(pendingStatus);
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(data.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: apiStatus }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; status?: string };
      if (!res.ok) {
        setPatchError(json.error || `Erreur ${res.status}`);
        setPatchLoading(false);
        return;
      }
      const nextRaw = typeof json.status === "string" ? json.status : apiStatus;
      setData((prev) => ({
        ...prev,
        statut: pendingStatus,
        rawApiStatus: nextRaw,
      }));
      setActionSelect("");
      setShowConfirmStatus(false);
      setPendingStatus(null);
    } catch {
      setPatchError("Réseau indisponible.");
    } finally {
      setPatchLoading(false);
    }
  };

  const cancelStatusChange = () => {
    setShowConfirmStatus(false);
    setPendingStatus(null);
    setActionSelect("");
  };

  async function refreshFromApi() {
    setPatchError(null);
    setParcelError(null);
    setRefreshLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(data.id)}`);
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setPatchError(json.error || `Erreur ${res.status}`);
        return;
      }
      const next = mapApiOrderToDetailData(json as unknown as Record<string, unknown>);
      setData(next);
      setSelectedParcelId((prev) => (next.parcels.some((p) => p.id === prev) ? prev : next.parcels?.[0]?.id || ""));
    } catch {
      setPatchError("Réseau indisponible.");
    } finally {
      setRefreshLoading(false);
    }
  }

  async function saveParcelWeight() {
    setParcelError(null);
    const parcelId = selectedParcel?.id || "";
    if (!parcelId) {
      setParcelError("Aucun colis associé à cette commande.");
      return;
    }
    const raw = poidsRecupere.trim().replace(",", ".");
    const weight = Number(raw);
    if (!Number.isFinite(weight) || weight <= 0) {
      setParcelError("Poids invalide. Exemple: 1,5");
      return;
    }
    setParcelLoading(true);
    try {
      const res = await fetch(`/api/admin/parcels/${encodeURIComponent(parcelId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weightKg: weight }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; weightKg?: string };
      if (!res.ok) {
        setParcelError(json.error || `Erreur ${res.status}`);
        return;
      }
      const next = typeof json.weightKg === "string" ? json.weightKg : String(weight);
      setData((prev) => ({
        ...prev,
        parcels: prev.parcels.map((p) => (p.id === parcelId ? { ...p, weightKg: next } : p)),
        poidsEstime: `${Number(next).toLocaleString("fr-FR")} kg`,
      }));
    } catch {
      setParcelError("Réseau indisponible.");
    } finally {
      setParcelLoading(false);
    }
  }

  async function saveExpeditionDate() {
    setParcelError(null);
    const parcelId = selectedParcel?.id || "";
    if (!parcelId) {
      setParcelError("Aucun colis associé à cette commande.");
      return;
    }
    const d = dateExpedition;
    if (!d) {
      setParcelError("Choisissez une date d’expédition.");
      return;
    }
    setParcelLoading(true);
    try {
      const res = await fetch(`/api/admin/parcels/${encodeURIComponent(parcelId)}/tracking-events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "SHIPPED",
          message: `Expédié le ${d}`,
          meta: { expeditionDate: d },
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; id?: string; status?: string; message?: string; createdAt?: string };
      if (!res.ok) {
        setParcelError(json.error || `Erreur ${res.status}`);
        return;
      }
      const ev = {
        id: String(json.id || crypto.randomUUID()),
        status: String(json.status || "SHIPPED"),
        message: String(json.message || `Expédié le ${d}`),
        at: String(json.createdAt || new Date().toISOString()),
      };
      setData((prev) => ({
        ...prev,
        parcels: prev.parcels.map((p) =>
          p.id === parcelId ? { ...p, trackingEvents: [ev, ...(p.trackingEvents || [])] } : p
        ),
      }));
    } catch {
      setParcelError("Réseau indisponible.");
    } finally {
      setParcelLoading(false);
    }
  }

  function formatEventDate(iso: string) {
    try {
      const dt = new Date(iso);
      return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(dt);
    } catch {
      return iso;
    }
  }

  const handlePrintLabel = () => {
    window.print();
  };

  const statusLabel: Record<OrderStatus, string> = {
    en_attente: "En attente",
    annule: "Annulé",
    en_cours: "En cours",
    livre: "Livré",
  };

  return (
    <>
      <p className="mb-3 text-xs text-figma-adminSub print:hidden">
        Les changements de statut sont enregistrés en base (audit). Colis : tout passe en livré avec « Marquer livré » ; un retour en « attente de paiement » remet les colis encore livrés en « créé ».
      </p>
      {patchError ? (
        <p className="mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 print:hidden">{patchError}</p>
      ) : null}
      {parcelError ? (
        <p className="mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 print:hidden">{parcelError}</p>
      ) : null}
      <section className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-figma-headerTitle">
            Statut de la commande&nbsp;:
          </span>
          <StatusPill status={data.statut} />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={refreshLoading}
            onClick={() => void refreshFromApi()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-figma-tableBorder bg-white px-3 py-2 text-xs font-medium text-figma-headerTitle hover:bg-figma-tableHeader disabled:opacity-60"
          >
            {refreshLoading ? "Actualisation…" : "Actualiser"}
          </button>
          <label className="text-xs font-medium text-figma-headerTitle">
            Faire une action&nbsp;:
          </label>
          <div className="relative">
            <select
              value={actionSelect}
              onChange={handleActionChange}
              className="appearance-none rounded-lg border border-figma-tableBorder bg-white px-3 py-2 pr-8 text-xs font-medium text-figma-headerTitle"
              aria-label="Sélectionner une action sur la commande"
            >
              {ORDER_ACTIONS.map((opt) => (
                <option key={opt.value || "empty"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
              <ChevronDownIcon />
            </span>
          </div>
          <button
            type="button"
            onClick={handlePrintLabel}
            className="inline-flex items-center gap-1.5 rounded-lg border border-figma-tableBorder bg-white px-3 py-2 text-xs font-medium text-figma-headerTitle hover:bg-figma-tableHeader"
          >
            <PrintIcon />
            Imprimer l&apos;étiquette
          </button>
        </div>
      </section>

      {showConfirmStatus && pendingStatus !== null && (
        <div className="rounded-xl border border-figma-tableBorder bg-white p-4 shadow-sm print:hidden">
          <p className="text-sm text-figma-headerTitle">
            Confirmer le changement de statut vers &quot;{statusLabel[pendingStatus]}&quot;&nbsp;?
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={patchLoading}
              onClick={() => void confirmStatusChange()}
              className="rounded-lg bg-[#D6364E] px-4 py-2 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {patchLoading ? "Enregistrement…" : "Confirmer"}
            </button>
            <button
              type="button"
              disabled={patchLoading}
              onClick={cancelStatusChange}
              className="rounded-lg border border-figma-tableBorder bg-white px-4 py-2 text-xs font-medium text-figma-headerTitle hover:bg-figma-tableHeader disabled:opacity-60"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <section className="grid gap-5 md:grid-cols-2 print:hidden">
        <InfoCard title="Informations de la commande">
          <InfoRow label="Numéro de commande" value={`#${data.id.slice(0, 8)}`} />
          <InfoRow label="Identifiant complet" value={data.id} />
          <InfoRow label="Date de commande" value={data.dateCommande} />
          <InfoRow label="Plateforme de commande" value={data.plateforme} />
          <InfoRow label="Statut (API)" value={data.rawApiStatus} />
          <InfoRow label="Montant total" value={data.montantTotal} />
          <InfoRow label="Poids colis (pesée)" value={data.poidsEstime} />
          {data.proofImageUrl ? (
            <div className="pt-2">
              <a
                href={data.proofImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-figma-activeMenuText hover:underline"
              >
                Ouvrir la photo de preuve
              </a>
            </div>
          ) : null}
          <div className="border-t border-figma-tableRowBorder pt-2 mt-2 space-y-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-figma-adminSub">Colis</span>
              <select
                value={selectedParcelId || (data.parcels?.[0]?.id || "")}
                onChange={(e) => setSelectedParcelId(e.target.value)}
                className="rounded-lg border border-figma-tableBorder bg-white px-3 py-2 text-sm text-figma-headerTitle"
                aria-label="Sélectionner un colis"
                disabled={data.parcels.length <= 1}
              >
                {data.parcels.length === 0 ? <option value="">Aucun colis</option> : null}
                {data.parcels.map((p, idx) => (
                  <option key={p.id} value={p.id}>
                    Colis {idx + 1} — {p.id.slice(0, 8)} ({p.status || "—"})
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-figma-adminSub">
                Poids du colis (réel, une fois récupéré à l&apos;entrepôt)
              </span>
              <input
                type="text"
                value={poidsRecupere}
                onChange={(e) => setPoidsRecupere(e.target.value)}
                placeholder="ex. 1,5 kg"
                className="rounded-lg border border-figma-tableBorder px-3 py-2 text-sm text-figma-headerTitle placeholder:text-figma-adminSub"
              />
            </label>
            <button
              type="button"
              disabled={parcelLoading}
              onClick={() => void saveParcelWeight()}
              className="rounded-lg bg-[#333333] px-3 py-2 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {parcelLoading ? "Enregistrement…" : "Enregistrer le poids"}
            </button>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-figma-adminSub">Date d&apos;expédition</span>
              <input
                type="date"
                value={dateExpedition}
                onChange={(e) => setDateExpedition(e.target.value)}
                className="rounded-lg border border-figma-tableBorder px-3 py-2 text-sm text-figma-headerTitle"
              />
            </label>
            <button
              type="button"
              disabled={parcelLoading}
              onClick={() => void saveExpeditionDate()}
              className="rounded-lg border border-figma-tableBorder bg-white px-3 py-2 text-xs font-medium text-figma-headerTitle hover:bg-figma-tableHeader disabled:opacity-60"
            >
              {parcelLoading ? "Enregistrement…" : "Enregistrer la date d’expédition"}
            </button>
          </div>
        </InfoCard>

        <InfoCard title="Suivi colis">
          {!selectedParcel?.id ? (
            <p className="text-sm text-figma-adminSub">Aucun colis associé.</p>
          ) : (selectedParcel.trackingEvents || []).length === 0 ? (
            <p className="text-sm text-figma-adminSub">Aucun événement de suivi.</p>
          ) : (
            <ol className="space-y-3">
              {(selectedParcel.trackingEvents || []).map((e) => (
                <li key={e.id} className="rounded-xl border border-figma-tableBorder bg-white px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-figma-headerTitle">{e.status}</p>
                      {e.message ? <p className="mt-1 text-sm text-figma-adminSub">{e.message}</p> : null}
                    </div>
                    <p className="text-xs text-figma-adminSub whitespace-nowrap">{formatEventDate(e.at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </InfoCard>

        <InfoCard title="Articles">
          {data.orderLines.length === 0 ? (
            <p className="text-sm text-figma-adminSub">Aucune ligne.</p>
          ) : (
            <ul className="space-y-2">
              {data.orderLines.map((l, i) => (
                <li key={i} className="flex flex-wrap justify-between gap-2 text-sm border-b border-figma-tableRowBorder pb-2 last:border-0">
                  <span className="text-figma-headerTitle">
                    {l.description} <span className="text-figma-adminSub">×{l.quantity}</span>
                  </span>
                  <span className="font-medium text-figma-headerTitle">{l.lineTotal}</span>
                </li>
              ))}
            </ul>
          )}
        </InfoCard>

        <InfoCard title="Entrepôt de récupération">
          <InfoRow label="Nom de l'entrepôt" value={data.entrepotNom} />
          <InfoRow label="Adresse" value={data.entrepotAdresse} />
          <InfoRow label="Pays" value={data.entrepotPays} />
          <InfoRow label="Téléphone" value={data.entrepotTelephone} />
        </InfoCard>

        <InfoCard
          title="Client destinataire"
          action={
            editingClient ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingClient(false);
                  }}
                  className="rounded-lg border border-figma-tableBorder bg-white px-3 py-1.5 text-xs font-medium text-figma-headerTitle hover:bg-figma-tableHeader"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingClient(false);
                  }}
                  className="rounded-lg bg-[#333333] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                >
                  Enregistrer
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditingClient(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-figma-tableBorder bg-white px-2 py-1 text-xs font-medium text-figma-headerTitle hover:bg-figma-tableHeader"
              >
                <EditIcon />
                Corriger les données
              </button>
            )
          }
        >
          {editingClient ? (
            <div className="space-y-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-figma-adminSub">Nom complet</span>
                <input
                  type="text"
                  value={data.clientNom}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, clientNom: e.target.value }))
                  }
                  className="rounded-lg border border-figma-tableBorder px-3 py-2 text-sm text-figma-headerTitle"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-figma-adminSub">Email</span>
                <input
                  type="email"
                  value={data.clientEmail}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, clientEmail: e.target.value }))
                  }
                  className="rounded-lg border border-figma-tableBorder px-3 py-2 text-sm text-figma-headerTitle"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-figma-adminSub">Téléphone</span>
                <input
                  type="text"
                  value={data.clientTelephone}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      clientTelephone: e.target.value,
                    }))
                  }
                  className="rounded-lg border border-figma-tableBorder px-3 py-2 text-sm text-figma-headerTitle"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-figma-adminSub">Adresse de livraison</span>
                <input
                  type="text"
                  value={data.clientAdresse}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      clientAdresse: e.target.value,
                    }))
                  }
                  className="rounded-lg border border-figma-tableBorder px-3 py-2 text-sm text-figma-headerTitle"
                />
              </label>
            </div>
          ) : (
            <>
              <InfoRow label="Nom complet" value={data.clientNom} />
              <InfoRow label="Email" value={data.clientEmail} />
              <InfoRow label="Téléphone" value={data.clientTelephone} />
              <InfoRow label="Adresse de livraison" value={data.clientAdresse} />
            </>
          )}
        </InfoCard>

        <InfoCard title="Solupacker">
          <InfoRow label="Nom complet" value={data.solupackerNom} />
          <InfoRow label="Nombre de missions" value={data.solupackerMissions} />
          <InfoRow label="Voyage" value={data.solupackerVoyage} />
          <InfoRow label="Date voyage" value={data.solupackerDateVoyage} />
        </InfoCard>

        <InfoCard title="Point relais">
          <InfoRow label="Nom du point relais" value={data.pointRelaisNom} />
          <InfoRow label="C. terminée" value={data.pointRelaisCTerminee} />
          <InfoRow label="C. en cours" value={data.pointRelaisCEnCours} />
          <InfoRow label="Adresse" value={data.pointRelaisAdresse} />
        </InfoCard>
      </section>

      <div className="hidden print:block fixed inset-0 z-[100] bg-white p-8">
        <div className="mx-auto max-w-md rounded-lg border-2 border-black p-6">
          <p className="text-xs text-black/70">Étiquette d&apos;expédition</p>
          <p className="mt-2 font-bold text-lg">Commande #{data.id.slice(0, 8)}</p>
          <p className="mt-2 text-sm">{data.clientNom}</p>
          <p className="text-sm">{data.clientAdresse}</p>
          <p className="mt-4 text-center text-2xl font-mono tracking-widest">
            {data.id}
          </p>
        </div>
      </div>
    </>
  );
}

function StatusPill({ status }: { status: OrderStatus }) {
  const classes: Record<OrderStatus, string> = {
    en_attente: "bg-[#FFF9CA] text-[#C09A00]",
    annule: "bg-[#FFB4B4] text-[#A31F1F]",
    en_cours: "bg-[#E3F2FD] text-[#1565C0]",
    livre: "bg-[#B4FFB5] text-[#218922]",
  };
  const labels: Record<OrderStatus, string> = {
    en_attente: "En attente",
    annule: "Annulé",
    en_cours: "En cours",
    livre: "Livré",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${classes[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 text-figma-label"
      aria-hidden
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PrintIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0"
      aria-hidden
    >
      <path
        d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 14h12v8H6z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoCard({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl bg-white shadow-sm px-6 py-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-figma-headerTitle">{title}</h3>
        {action}
      </div>
      <div className="space-y-1.5">{children}</div>
    </article>
  );
}

function EditIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0"
      aria-hidden
    >
      <path
        d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-row items-baseline justify-between gap-3 text-sm">
      <span className="text-figma-adminSub">{label} :</span>
      <span className="font-medium text-figma-headerTitle text-right">
        {value}
      </span>
    </div>
  );
}
