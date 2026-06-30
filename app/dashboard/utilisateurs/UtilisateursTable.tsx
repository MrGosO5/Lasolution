"use client";

import * as React from "react";

export type UserRow = {
  nom: string;
  prenoms: string;
  email: string;
  pays: string;
  dateInscription: string;
  nbrCommandes: number;
};

const ROLES = ["Utilisateur", "Solupacker", "Point relais", "Admin"] as const;

export function UtilisateursTable({ users }: { users: UserRow[] }) {
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);
  const [modal, setModal] = React.useState<
    "none" | "historique" | "role" | "desactiver"
  >("none");
  const [selectedUser, setSelectedUser] = React.useState<UserRow | null>(null);
  const [disabledIds, setDisabledIds] = React.useState<Set<string>>(new Set());
  const [roles, setRoles] = React.useState<Record<string, string>>({});

  const getRole = (email: string) => roles[email] ?? "Utilisateur";
  const isDisabled = (email: string) => disabledIds.has(email);

  const openHistorique = (row: UserRow) => {
    setSelectedUser(row);
    setModal("historique");
    setOpenMenuId(null);
  };
  const openRole = (row: UserRow) => {
    setSelectedUser(row);
    setModal("role");
    setOpenMenuId(null);
  };
  const openDesactiver = (row: UserRow) => {
    setSelectedUser(row);
    setModal("desactiver");
    setOpenMenuId(null);
  };

  const confirmDesactiver = () => {
    if (selectedUser) {
      setDisabledIds((prev) => new Set(prev).add(selectedUser.email));
      setModal("none");
      setSelectedUser(null);
    }
  };

  const confirmRole = (role: string) => {
    if (selectedUser) {
      setRoles((prev) => ({ ...prev, [selectedUser.email]: role }));
      setModal("none");
      setSelectedUser(null);
    }
  };

  return (
    <>
      <div className="border border-figma-tableBorder rounded-card overflow-hidden bg-white shadow-card">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="bg-figma-tableHeader border-b border-figma-tableBorder">
              <th className="text-left font-semibold text-sm text-figma-headerTitle py-3.5 px-4">
                Nom
              </th>
              <th className="text-left font-semibold text-sm text-figma-headerTitle py-3.5 px-4">
                Prénoms
              </th>
              <th className="text-left font-semibold text-sm text-figma-headerTitle py-3.5 px-4">
                Email
              </th>
              <th className="text-left font-semibold text-sm text-figma-headerTitle py-3.5 px-4">
                Pays de résidence
              </th>
              <th className="text-left font-semibold text-sm text-figma-headerTitle py-3.5 px-4">
                Date d&apos;inscription
              </th>
              <th className="text-left font-semibold text-sm text-figma-headerTitle py-3.5 px-4">
                Nbr. Commandes
              </th>
              <th className="text-left font-semibold text-sm text-figma-headerTitle py-3.5 px-4 w-[120px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 px-4 text-center text-sm text-figma-adminSub">
                  Aucun utilisateur pour le moment.
                </td>
              </tr>
            ) : null}
            {users.map((row) => (
              <tr
                key={row.email}
                className={`border-b border-figma-tableRowBorder last:border-0 transition-colors duration-fast ${
                  isDisabled(row.email)
                    ? "bg-figma-tableRowBorder/50 opacity-60"
                    : "bg-white hover:bg-figma-tableRowHover"
                }`}
              >
                <td className="py-3 px-4 text-sm text-figma-headerTitle font-medium">
                  {row.nom}
                </td>
                <td className="py-3 px-4 text-sm text-figma-headerTitle">
                  {row.prenoms}
                </td>
                <td className="py-3 px-4 text-sm text-figma-headerTitle">
                  {row.email}
                </td>
                <td className="py-3 px-4 text-sm text-figma-headerTitle">
                  {row.pays}
                </td>
                <td className="py-3 px-4 text-sm text-figma-headerTitle">
                  {row.dateInscription}
                </td>
                <td className="py-3 px-4 text-sm text-figma-headerTitle">
                  {row.nbrCommandes}
                </td>
                <td className="py-3 px-4">
                  {isDisabled(row.email) ? (
                    <span className="text-xs text-figma-adminSub font-medium">
                      Compte désactivé
                    </span>
                  ) : (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenuId(openMenuId === row.email ? null : row.email)
                        }
                        className="flex items-center justify-center w-8 h-8 rounded-input border border-figma-tableBorder bg-white hover:bg-figma-tableRowHover text-figma-label"
                        aria-label="Ouvrir le menu d'actions"
                      >
                        <EllipsisIcon />
                      </button>
                      {openMenuId === row.email && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            aria-hidden
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className="absolute right-0 top-full mt-1 z-20 min-w-[180px] rounded-card border border-figma-tableBorder bg-white shadow-cardHover py-1">
                            <button
                              type="button"
                              className="w-full text-left px-4 py-2 text-sm text-figma-headerTitle hover:bg-figma-tableRowHover"
                              onClick={() => openHistorique(row)}
                            >
                              Voir l&apos;historique
                            </button>
                            <button
                              type="button"
                              className="w-full text-left px-4 py-2 text-sm text-figma-headerTitle hover:bg-figma-tableRowHover"
                              onClick={() => openRole(row)}
                            >
                              Changer le rôle
                            </button>
                            <button
                              type="button"
                              className="w-full text-left px-4 py-2 text-sm text-[#DC2626] hover:bg-red-50"
                              onClick={() => openDesactiver(row)}
                            >
                              Désactiver le compte
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {modal === "historique" && selectedUser && (
        <Modal onClose={() => { setModal("none"); setSelectedUser(null); }}>
          <div className="min-w-[320px] max-w-md">
            <h3 className="text-base font-semibold text-figma-headerTitle mb-1">
              Historique d&apos;activité
            </h3>
            <p className="text-sm text-figma-adminSub mb-4">
              {selectedUser.prenoms} {selectedUser.nom} — {selectedUser.email}
            </p>
            <p className="text-sm text-figma-adminSub">
              Aucun historique enregistré pour ce compte.
            </p>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded-button bg-figma-headerTitle text-white text-sm font-medium hover:opacity-90"
                onClick={() => { setModal("none"); setSelectedUser(null); }}
              >
                Fermer
              </button>
            </div>
          </div>
        </Modal>
      )}

      {modal === "role" && selectedUser && (
        <Modal onClose={() => { setModal("none"); setSelectedUser(null); }}>
          <div className="min-w-[280px]">
            <h3 className="text-base font-semibold text-figma-headerTitle mb-1">
              Changer le rôle
            </h3>
            <p className="text-sm text-figma-adminSub mb-4">
              {selectedUser.prenoms} {selectedUser.nom}
            </p>
            <p className="text-xs text-figma-adminSub mb-2">
              Rôle actuel : <strong>{getRole(selectedUser.email)}</strong>
            </p>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  className={`px-3 py-2 rounded-button text-sm font-medium transition-colors ${
                    getRole(selectedUser.email) === role
                      ? "bg-figma-activeMenuText text-white"
                      : "border border-figma-tableBorder text-figma-headerTitle hover:bg-figma-tableRowHover"
                  }`}
                  onClick={() => confirmRole(role)}
                >
                  {role}
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-button border border-figma-tableBorder text-sm font-medium"
                onClick={() => { setModal("none"); setSelectedUser(null); }}
              >
                Annuler
              </button>
            </div>
          </div>
        </Modal>
      )}

      {modal === "desactiver" && selectedUser && (
        <Modal onClose={() => { setModal("none"); setSelectedUser(null); }}>
          <div className="min-w-[320px]">
            <h3 className="text-base font-semibold text-figma-headerTitle mb-1">
              Désactiver le compte
            </h3>
            <p className="text-sm text-figma-adminSub mb-4">
              Êtes-vous sûr de vouloir désactiver le compte de{" "}
              <strong>{selectedUser.prenoms} {selectedUser.nom}</strong> ? L&apos;utilisateur ne pourra plus se connecter.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-button border border-figma-tableBorder text-sm font-medium"
                onClick={() => { setModal("none"); setSelectedUser(null); }}
              >
                Annuler
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-button bg-[#DC2626] text-white text-sm font-medium hover:opacity-90"
                onClick={confirmDesactiver}
              >
                Désactiver
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
      <div className="relative bg-white rounded-card shadow-cardHover px-6 py-5 mx-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 text-figma-label hover:text-figma-headerTitle"
          aria-label="Fermer"
        >
          <CloseIcon />
        </button>
        {children}
      </div>
    </div>
  );
}

function EllipsisIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden>
      <circle cx="12" cy="6" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="18" r="1.5" fill="currentColor" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 8l8 8M16 8l-8 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
