import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { lasolutionFetchJson } from "@/lib/lasolution-api";
import { DashboardHeader } from "../components/DashboardHeader";
import { DemandesClient } from "./DemandesClient";

type ApiApplication = {
  id: string;
  type: string;
  email: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
};

type DemandeRow = {
  nom: string;
  prenoms: string;
  email: string;
  paysResidence: string;
  dateDemande: string;
  typeDemande: string;
};

function mapApplication(a: ApiApplication): DemandeRow {
  const meta = (a.meta as Record<string, unknown>) ?? {};
  const firstName = String(meta.firstName ?? "");
  const lastName = String(meta.lastName ?? "");
  const typeDemande = a.type === "solupacker_application" ? "SoluPacker" : "Point relais";
  return {
    prenoms: firstName || "—",
    nom: lastName || "—",
    email: a.email || "—",
    paysResidence: String(meta.country ?? meta.address ?? meta.city ?? "—"),
    dateDemande: new Date(a.createdAt).toLocaleDateString("fr-FR"),
    typeDemande,
  };
}

export default async function DemandesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await getServerSession(authOptions);
  const q = String(searchParams.q || "").trim();

  let demandes: DemandeRow[] = [];
  let total = 0;

  const qs = new URLSearchParams({ pageSize: "50" });
  if (q) qs.set("search", q);

  try {
    const res = await lasolutionFetchJson<{ data: ApiApplication[]; pagination: { total: number } }>(`/admin/applications?${qs}`);
    demandes = (res.data || []).map(mapApplication);
    total = res.pagination?.total ?? 0;
  } catch { /* backend indisponible */ }

  return (
    <>
      <DashboardHeader
        title="Demandes"
        subtitle="Validez les demandes de points relais partenaires"
        session={session}
        rightSlot={
          <form method="GET">
            <label className="flex items-center gap-2 px-3 py-2 rounded-input border border-figma-tableBorder bg-white min-w-[220px] max-w-[300px] shadow-card focus-within:ring-2 focus-within:ring-figma-activeMenuText/20 focus-within:border-figma-activeMenuText/50 transition-shadow duration-fast">
              <SearchIcon className="w-4 h-4 text-[#777]" />
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Rechercher une demande"
                className="flex-1 bg-transparent text-sm text-figma-headerTitle placeholder:text-figma-adminSub outline-none"
              />
            </label>
          </form>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 md:pl-[23px] md:pt-[26px]">
        <div className="flex flex-col gap-[30px] max-w-[1150px]">
          {total > 0 && (
            <p className="text-sm text-figma-adminSub">
              {total} demande{total !== 1 ? "s" : ""} en attente
              {q ? ` — résultats pour "${q}"` : ""}
            </p>
          )}
          <DemandesClient demandes={demandes} />
        </div>
      </div>
    </>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={`shrink-0 ${className ?? ""}`} aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
