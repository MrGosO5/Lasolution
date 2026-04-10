"use client";

import * as React from "react";

type DemandeRow = {
  nom: string;
  prenoms: string;
  email: string;
  paysResidence: string;
  dateDemande: string;
  typeDemande: string;
};

export function DemandesClient({ demandes }: { demandes: DemandeRow[] }) {
  const [activeTab, setActiveTab] = React.useState<"tous" | "solupackers" | "points_relais">("tous");
  const [selectedDemande, setSelectedDemande] = React.useState<DemandeRow | null>(null);
  const [step, setStep] = React.useState<
    "none" | "confirm" | "choose_solupacker" | "choose_point_relais" | "success" | "error"
  >("none");

  const isPointRelais = selectedDemande?.typeDemande?.toLowerCase().includes("point relais") ?? false;

  const filteredDemandes = demandes.filter((row) => {
    if (activeTab === "solupackers") return row.typeDemande.toLowerCase().includes("solupacker");
    if (activeTab === "points_relais") return row.typeDemande.toLowerCase().includes("point relais");
    return true;
  });

  const openConfirm = (row: DemandeRow) => {
    setSelectedDemande(row);
    setStep("confirm");
  };

  const closeAll = () => {
    setStep("none");
    setSelectedDemande(null);
  };

  const onConfirmYes = () => {
    if (isPointRelais) setStep("choose_point_relais");
    else setStep("choose_solupacker");
  };

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
          <div className="flex items-center gap-2">
            <ActionButton icon={<SortIcon />}>A-Z</ActionButton>
            <ActionButton icon={<FilterIcon />}>Filtrer</ActionButton>
            <ActionButton icon={<ExportIcon />}>Exporter</ActionButton>
          </div>
        </div>

        <div className="border border-figma-tableBorder rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-figma-tableHeader border-b border-figma-tableBorder">
                <Th>Nom</Th>
                <Th>Prénoms</Th>
                <Th>Email</Th>
                <Th>Pays de résidence</Th>
                <Th>Date de demande</Th>
                <Th>Type de demande</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody>
              {filteredDemandes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 px-3 text-center text-sm text-figma-adminSub">
                    Aucune demande pour le moment.
                  </td>
                </tr>
              ) : (
                filteredDemandes.map((row) => (
                  <tr
                    key={`${row.nom}-${row.prenoms}-${row.email}-${row.dateDemande}`}
                    className="border-b border-figma-tableRowBorder last:border-0 bg-white"
                  >
                    <Td>{row.nom}</Td>
                    <Td>{row.prenoms}</Td>
                    <Td>{row.email}</Td>
                    <Td>{row.paysResidence}</Td>
                    <Td>{row.dateDemande}</Td>
                    <Td>{row.typeDemande}</Td>
                    <Td>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg border border-figma-tableBorder bg-white text-xs font-medium text-figma-headerTitle hover:bg-figma-tableHeader"
                        onClick={() => openConfirm(row)}
                      >
                        Voir la demande
                      </button>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {step === "confirm" && selectedDemande && (
        <Modal onClose={closeAll}>
          <div className="flex flex-col items-center gap-4 min-w-[320px]">
            <p className="text-center text-sm text-figma-headerTitle">
              Acceptez-vous la demande {isPointRelais ? "de point relais" : "de solupacker"} de{" "}
              <strong>{selectedDemande.prenoms} {selectedDemande.nom}</strong>&nbsp;?
            </p>
            <div className="flex items-center justify-between gap-6">
              <button
                type="button"
                className="px-6 py-2 rounded-button bg-figma-headerTitle text-white text-sm font-medium hover:opacity-90 transition-opacity"
                onClick={() => setStep("error")}
              >
                Non
              </button>
              <button
                type="button"
                className="px-6 py-2 rounded-button bg-[#D6364E] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                onClick={onConfirmYes}
              >
                Oui
              </button>
            </div>
          </div>
        </Modal>
      )}

      {step === "choose_solupacker" && (
        <Modal onClose={closeAll}>
          <div className="flex flex-col gap-3 w-[320px] sm:w-[560px]">
            <h3 className="text-base font-semibold text-figma-headerTitle">
              Choisissez un solupacker
            </h3>
            <p className="text-xs text-figma-adminSub">
              Sélectionnez le solupacker qui prendra en charge la mission.
            </p>
            <div className="flex items-center gap-2 border border-figma-dropdownBorder rounded-input px-3 py-2 bg-white">
              <SearchIcon />
              <input
                type="text"
                placeholder="Rechercher un solupacker"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-figma-adminSub"
              />
            </div>
            <div className="border border-figma-tableBorder rounded-card overflow-hidden">
              <div className="flex items-center px-3 py-2.5 bg-figma-tableHeader text-xs font-semibold text-figma-headerTitle">
                <span className="w-1/4">Nom complet</span>
                <span className="w-1/4">C. Terminée</span>
                <span className="w-1/4">C. En cours</span>
                <span className="w-1/4">Voyage</span>
              </div>
              <div className="divide-y divide-figma-tableRowBorder">
                <p className="px-3 py-6 text-sm text-figma-adminSub text-center">
                  Aucun solupacker disponible. Les comptes apparaîtront ici une fois créés dans le système.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-button border border-figma-tableBorder text-sm font-medium text-figma-headerTitle hover:bg-figma-tableRowHover"
                onClick={closeAll}
              >
                Annuler
              </button>
              <button
                type="button"
                className="px-6 py-2 rounded-button bg-[#D6364E] text-white text-sm font-medium hover:opacity-90"
                onClick={() => setStep("success")}
              >
                Valider
              </button>
            </div>
          </div>
        </Modal>
      )}

      {step === "choose_point_relais" && (
        <Modal onClose={closeAll}>
          <div className="flex flex-col gap-3 w-[320px] sm:w-[560px]">
            <h3 className="text-base font-semibold text-figma-headerTitle">
              Choisissez un point relais
            </h3>
            <p className="text-xs text-figma-adminSub">
              Associez cette demande au point relais correspondant.
            </p>
            <div className="flex items-center gap-2 border border-figma-dropdownBorder rounded-input px-3 py-2 bg-white">
              <SearchIcon />
              <input
                type="text"
                placeholder="Rechercher un point relais"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-figma-adminSub"
              />
            </div>
            <div className="border border-figma-tableBorder rounded-card overflow-hidden">
              <div className="flex items-center px-3 py-2.5 bg-figma-tableHeader text-xs font-semibold text-figma-headerTitle">
                <span className="w-1/2">Nom du point relais</span>
                <span className="w-1/2">Adresse</span>
              </div>
              <div className="divide-y divide-figma-tableRowBorder">
                <p className="px-3 py-6 text-sm text-figma-adminSub text-center">
                  Aucun point relais disponible. Les points relais apparaîtront ici une fois enregistrés.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-button border border-figma-tableBorder text-sm font-medium text-figma-headerTitle hover:bg-figma-tableRowHover"
                onClick={closeAll}
              >
                Annuler
              </button>
              <button
                type="button"
                className="px-6 py-2 rounded-button bg-[#D6364E] text-white text-sm font-medium hover:opacity-90"
                onClick={() => setStep("success")}
              >
                Valider
              </button>
            </div>
          </div>
        </Modal>
      )}

      {step === "success" && (
        <Toast
          variant="success"
          message="Vous venez d’accepter la demande solupacker"
          onClose={closeAll}
        />
      )}

      {step === "error" && (
        <Toast
          variant="error"
          message={selectedDemande ? `Demande de ${selectedDemande.prenoms} ${selectedDemande.nom} refusée.` : "Demande refusée."}
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

function ActionButton({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-figma-tableBorder bg-white text-sm font-medium text-figma-headerTitle hover:bg-figma-tableHeader"
    >
      {icon}
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
    const id = setTimeout(onClose, 3000);
    return () => clearTimeout(id);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="flex flex-col items-center gap-2 rounded-lg bg-white px-6 py-4 shadow-lg w-[260px]">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full ${
            isSuccess ? "bg-[#4CC266]" : "bg-[#DF334D]"
          }`}
        >
          {/* simple circle icon to mimic badge */}
        </div>
        <p className="text-center text-sm text-figma-headerTitle">{message}</p>
      </div>
    </div>
  );
}

function SortIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 text-figma-label"
      aria-hidden
    >
      <path
        d="M7 15l5 5 5-5M7 9l5-5 5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 text-figma-label"
      aria-hidden
    >
      <path
        d="M4 6h16M4 12h10M4 18h7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 text-figma-label"
      aria-hidden
    >
      <path
        d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 text-[#222222]"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M16 16l4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0"
      aria-hidden
    >
      <path
        d="M8 8l8 8M16 8l-8 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

