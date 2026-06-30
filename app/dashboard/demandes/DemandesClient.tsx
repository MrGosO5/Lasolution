"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { DemandeRow } from "./types";

function statusLabel(status: string) {
  if (status === "accepted") return "Acceptée";
  if (status === "refused") return "Refusée";
  return "En attente";
}

function statusClass(status: string) {
  if (status === "accepted") return "bg-emerald-100 text-emerald-800";
  if (status === "refused") return "bg-red-100 text-red-800";
  return "bg-amber-100 text-amber-900";
}

export function DemandesClient({ demandes }: { demandes: DemandeRow[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<"tous" | "solupackers" | "points_relais">("tous");
  const [selectedDemande, setSelectedDemande] = React.useState<DemandeRow | null>(null);
  const [step, setStep] = React.useState<"none" | "accept" | "refuse" | "success" | "error">("none");
  const [refuseReason, setRefuseReason] = React.useState("");
  const [actionLoading, setActionLoading] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [toastMessage, setToastMessage] = React.useState("");

  const filteredDemandes = demandes.filter((row) => {
    if (activeTab === "solupackers") return row.typeDemande.toLowerCase().includes("solupacker");
    if (activeTab === "points_relais") return row.typeDemande.toLowerCase().includes("point relais");
    return true;
  });

  const isProcessed = (row: DemandeRow) => row.status === "accepted" || row.status === "refused";

  const closeAll = () => {
    setStep("none");
    setSelectedDemande(null);
    setRefuseReason("");
    setActionError(null);
    setActionLoading(false);
  };

  async function handleAccept(row: DemandeRow) {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/applications/${encodeURIComponent(row.id)}/accept`, {
        method: "PATCH",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setActionError(data.error || "Acceptation impossible.");
        setStep("error");
        return;
      }
      setToastMessage(`Demande de ${row.prenoms} ${row.nom} acceptée — compte créé et email envoyé.`);
      setStep("success");
      router.refresh();
    } catch {
      setActionError("Réseau indisponible.");
      setStep("error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRefuse(row: DemandeRow) {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/applications/${encodeURIComponent(row.id)}/refuse`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: refuseReason }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setActionError(data.error || "Refus impossible.");
        setStep("error");
        return;
      }
      setToastMessage(`Demande de ${row.prenoms} ${row.nom} refusée.`);
      setStep("success");
      router.refresh();
    } catch {
      setActionError("Réseau indisponible.");
      setStep("error");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <>
      <section className="flex flex-col gap-3">
        <div className="flex flex-row flex-wrap items-center justify-between gap-4">
          <div className="flex flex-row rounded-lg overflow-hidden border border-figma-tableBorder bg-figma-tableHeader">
            <TabButton active={activeTab === "tous"} onClick={() => setActiveTab("tous")}>
              Tous
            </TabButton>
            <TabButton active={activeTab === "solupackers"} onClick={() => setActiveTab("solupackers")}>
              Solupackers
            </TabButton>
            <TabButton active={activeTab === "points_relais"} onClick={() => setActiveTab("points_relais")}>
              Points relais
            </TabButton>
          </div>
        </div>

        <div className="border border-figma-tableBorder rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr className="bg-figma-tableHeader border-b border-figma-tableBorder">
                  <Th>Nom</Th>
                  <Th>Email</Th>
                  <Th>Téléphone</Th>
                  <Th>Date candidature</Th>
                  <Th>Type</Th>
                  <Th>Statut</Th>
                  <Th>Documents</Th>
                  <Th>Accepter</Th>
                  <Th>Refuser</Th>
                  <Th>Date traitement</Th>
                </tr>
              </thead>
              <tbody>
                {filteredDemandes.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-10 px-3 text-center text-sm text-figma-adminSub">
                      Aucune demande pour le moment.
                    </td>
                  </tr>
                ) : (
                  filteredDemandes.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-figma-tableRowBorder last:border-0 bg-white"
                    >
                      <Td>
                        {row.prenoms} {row.nom}
                      </Td>
                      <Td>{row.email}</Td>
                      <Td>{row.phone}</Td>
                      <Td>{row.dateDemande}</Td>
                      <Td>{row.typeDemande}</Td>
                      <Td>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(row.status)}`}>
                          {statusLabel(row.status)}
                        </span>
                      </Td>
                      <Td>
                        <div className="flex flex-wrap gap-1">
                          {row.documents.length === 0 ? (
                            <span className="text-xs text-figma-adminSub">—</span>
                          ) : (
                            row.documents.map((doc) => (
                              <a
                                key={doc.type}
                                href={`/api/admin/applications/${encodeURIComponent(row.id)}/document/${encodeURIComponent(doc.type)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-figma-activeMenuText underline hover:opacity-80"
                              >
                                {doc.label}
                              </a>
                            ))
                          )}
                        </div>
                      </Td>
                      <Td>
                        <button
                          type="button"
                          disabled={isProcessed(row)}
                          className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-xs font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed"
                          onClick={() => {
                            setSelectedDemande(row);
                            setStep("accept");
                          }}
                        >
                          Accepter
                        </button>
                      </Td>
                      <Td>
                        <button
                          type="button"
                          disabled={isProcessed(row)}
                          className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 text-xs font-medium text-red-800 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
                          onClick={() => {
                            setSelectedDemande(row);
                            setRefuseReason("");
                            setStep("refuse");
                          }}
                        >
                          Refuser
                        </button>
                      </Td>
                      <Td>{row.processedAt || "—"}</Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {step === "accept" && selectedDemande && (
        <Modal onClose={closeAll}>
          <div className="flex flex-col gap-4 min-w-[320px] max-w-md">
            <p className="text-sm text-figma-headerTitle">
              Accepter la demande <strong>{selectedDemande.typeDemande}</strong> de{" "}
              <strong>
                {selectedDemande.prenoms} {selectedDemande.nom}
              </strong>
              &nbsp;? Un compte partenaire sera créé et les identifiants envoyés par email.
            </p>
            {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-button border border-figma-tableBorder text-sm font-medium"
                onClick={closeAll}
                disabled={actionLoading}
              >
                Annuler
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-button bg-emerald-600 text-white text-sm font-medium hover:opacity-90 disabled:opacity-60"
                disabled={actionLoading}
                onClick={() => void handleAccept(selectedDemande)}
              >
                {actionLoading ? "Traitement…" : "Confirmer l'acceptation"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {step === "refuse" && selectedDemande && (
        <Modal onClose={closeAll}>
          <div className="flex flex-col gap-4 min-w-[320px] max-w-md">
            <p className="text-sm text-figma-headerTitle">
              Refuser la demande de{" "}
              <strong>
                {selectedDemande.prenoms} {selectedDemande.nom}
              </strong>
              &nbsp;?
            </p>
            <label className="grid gap-1">
              <span className="text-xs font-medium text-figma-adminSub">Motif (optionnel)</span>
              <textarea
                value={refuseReason}
                onChange={(e) => setRefuseReason(e.target.value)}
                rows={3}
                className="rounded-input border border-figma-tableBorder px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-figma-activeMenuText/20"
                placeholder="Raison du refus…"
              />
            </label>
            {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-button border border-figma-tableBorder text-sm font-medium"
                onClick={closeAll}
                disabled={actionLoading}
              >
                Annuler
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-button bg-[#D6364E] text-white text-sm font-medium hover:opacity-90 disabled:opacity-60"
                disabled={actionLoading}
                onClick={() => void handleRefuse(selectedDemande)}
              >
                {actionLoading ? "Traitement…" : "Confirmer le refus"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {step === "success" && (
        <Toast variant="success" message={toastMessage} onClose={closeAll} />
      )}

      {step === "error" && (
        <Toast
          variant="error"
          message={actionError || "Une erreur est survenue."}
          onClose={closeAll}
        />
      )}
    </>
  );
}

function TabButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-figma-activeMenuText text-white"
          : "bg-transparent text-figma-headerTitle hover:bg-black/5"
      }`}
    >
      {children}
    </button>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left font-semibold text-sm leading-[140%] text-black py-3 px-3">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="py-2 px-3 font-normal text-sm leading-[140%] text-black">
      {children}
    </td>
  );
}

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20">
      <div className="relative bg-white rounded-lg shadow-lg px-6 py-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2 top-2 text-[#000000] hover:text-black"
          aria-label="Fermer"
        >
          <CloseIcon />
        </button>
        {children}
      </div>
    </div>
  );
}

function Toast({
  variant,
  message,
  onClose,
}: {
  variant: "success" | "error";
  message: string;
  onClose: () => void;
}) {
  const isSuccess = variant === "success";
  React.useEffect(() => {
    const id = setTimeout(onClose, 4000);
    return () => clearTimeout(id);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="flex flex-col items-center gap-2 rounded-lg bg-white px-6 py-4 shadow-lg max-w-[320px]">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full ${
            isSuccess ? "bg-[#4CC266]" : "bg-[#DF334D]"
          }`}
        />
        <p className="text-center text-sm text-figma-headerTitle">{message}</p>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden>
      <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
