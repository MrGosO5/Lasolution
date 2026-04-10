import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DashboardHeader } from "../components/DashboardHeader";

export default async function ParametresPage() {
  const session = await getServerSession(authOptions);

  return (
    <>
      <DashboardHeader
        title="Paramètres"
        subtitle="Informations du compte et configuration de la plateforme"
        session={session}
      />

      <div className="flex-1 overflow-y-auto p-6 md:pl-[23px] md:pt-[26px]">
        <div className="flex flex-col gap-6 max-w-[1150px]">
          <h2 className="text-lg font-semibold text-figma-headerTitle">
            Paramètres administrateur
          </h2>

          <section className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-4">
              {/* Information de compte */}
              <article className="flex flex-col gap-4 rounded-card bg-white shadow-card px-6 py-5 border border-figma-cardBorder">
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    <span className="text-2xl font-semibold text-figma-headerTitle">
                      {session?.user?.name?.[0] ?? "D"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-figma-headerTitle">
                      Information de compte
                    </span>
                    <span className="text-xs text-figma-adminSub">
                      Gérer les informations de votre profil administrateur.
                    </span>
                  </div>
                </div>

                <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
                  <dt className="font-medium text-figma-headerTitle">
                    Nom complet&nbsp;:
                  </dt>
                  <dd className="text-figma-headerTitle">
                    {session?.user?.name ?? "Davis George"}
                  </dd>

                  <dt className="font-medium text-figma-headerTitle">Email&nbsp;:</dt>
                  <dd className="text-figma-headerTitle">
                    {session?.user?.email ?? "admin@lasolution.com"}
                  </dd>

                  <dt className="font-medium text-figma-headerTitle">Rôle&nbsp;:</dt>
                  <dd className="text-figma-headerTitle">Super Admin</dd>

                  <dt className="font-medium text-figma-headerTitle">
                    Mot de passe&nbsp;:
                  </dt>
                  <dd className="text-figma-headerTitle">********</dd>
                </dl>

                <div>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-button bg-figma-headerTitle px-4 py-2 text-xs font-medium text-white hover:opacity-90 transition-opacity duration-fast"
                  >
                    Modifier
                  </button>
                </div>
              </article>

              {/* Gestion de la plateforme */}
              <article className="flex flex-col gap-3 rounded-card bg-white shadow-card px-6 py-4 border border-figma-cardBorder">
                <h3 className="text-sm font-semibold text-figma-headerTitle">
                  Gestion de la plateforme
                </h3>
                <ul className="flex flex-col gap-1 text-sm">
                  <li className="flex items-center justify-between">
                    <span className="text-figma-headerTitle">
                      Exporter la base utilisateur
                    </span>
                    <button
                      type="button"
                      className="text-xs font-medium text-figma-activeMenuText hover:underline"
                    >
                      Exporter
                    </button>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-figma-headerTitle">Les transactions</span>
                    <button
                      type="button"
                      className="text-xs font-medium text-figma-activeMenuText hover:underline"
                    >
                      Exporter
                    </button>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-figma-headerTitle">Les commandes</span>
                    <button
                      type="button"
                      className="text-xs font-medium text-figma-activeMenuText hover:underline"
                    >
                      Exporter
                    </button>
                  </li>
                </ul>
              </article>

              {/* Moyens de recharge de carte */}
              <article className="flex flex-col gap-3 rounded-card bg-white shadow-card px-6 py-4 border border-figma-cardBorder">
                <h3 className="text-sm font-semibold text-figma-headerTitle">
                  Moyens de recharge de carte
                </h3>
                <ul className="flex flex-col gap-2 text-sm text-figma-headerTitle">
                  <li className="flex items-center gap-2">
                    <Checkbox checked />
                    <span>MTN MoMo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Checkbox checked />
                    <span>Orange Money</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Checkbox checked />
                    <span>Moov Money</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Checkbox checked />
                    <span>Wave</span>
                  </li>
                </ul>
              </article>
            </div>

            {/* Colonne droite : Configuration générale */}
            <article className="flex flex-col gap-4 rounded-card bg-white shadow-card px-6 py-5 border border-figma-cardBorder">
              <h3 className="text-sm font-semibold text-figma-headerTitle">
                Configuration générale
              </h3>
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
                <dt className="font-medium text-figma-headerTitle">
                  Nom de la plateforme&nbsp;:
                </dt>
                <dd className="text-figma-headerTitle">La Solution</dd>

                <dt className="font-medium text-figma-headerTitle">
                  Adresse de contact support&nbsp;:
                </dt>
                <dd className="text-figma-headerTitle">
                  support@lasolution.com
                </dd>

                <dt className="font-medium text-figma-headerTitle">
                  Devise principale&nbsp;:
                </dt>
                <dd className="text-figma-headerTitle">Euro (€)</dd>

                <dt className="font-medium text-figma-headerTitle">
                  Fuseau horaire&nbsp;:
                </dt>
                <dd className="text-figma-headerTitle">
                  UTC+1 (Afrique de l&apos;Ouest)
                </dd>
              </dl>
              <div>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg bg-[#333333] px-4 py-2 text-xs font-medium text-white hover:bg-black"
                >
                  Modifier
                </button>
              </div>
            </article>
          </section>
        </div>
      </div>
    </>
  );
}

function Checkbox({ checked }: { checked?: boolean }) {
  return (
    <span
      className={`flex h-4 w-4 items-center justify-center rounded-[3px] border border-[#111] ${
        checked ? "bg-[#111]" : "bg-white"
      }`}
      aria-hidden
    >
      {checked ? (
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="none"
          className="shrink-0 text-white"
        >
          <path
            d="M2 6.5L4.5 9 10 3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </span>
  );
}

