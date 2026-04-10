import { getServerSession } from "next-auth";
import Link from "next/link";
import { DeliveryTruck } from "iconoir-react";
import { authOptions } from "@/lib/auth";
import { lasolutionFetchJson } from "@/lib/lasolution-api";
import { DashboardHeader } from "../components/DashboardHeader";
import { UtilisateursTable, type UserRow } from "./UtilisateursTable";

type ApiUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  profile: Record<string, unknown> | null;
};

type UserStats = {
  total: number;
  byRole: Record<string, number>;
};

type UsersResponse = {
  data: ApiUser[];
  pagination: { page: number; pageSize: number; total: number };
};

function mapApiUser(u: ApiUser): UserRow {
  const parts = (u.name || u.email).split(" ");
  const prenoms = parts[0] ?? "";
  const nom = parts.slice(1).join(" ") || prenoms;
  const pays = String((u.profile as Record<string, unknown>)?.country ?? "—");
  return {
    nom,
    prenoms,
    email: u.email,
    pays,
    dateInscription: new Date(u.createdAt).toLocaleDateString("fr-FR"),
    nbrCommandes: 0,
  };
}

export default async function UtilisateursPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await getServerSession(authOptions);
  const q = String(searchParams.q || "").trim();

  let users: UserRow[] = [];
  let stats: UserStats = { total: 0, byRole: {} };
  let demandes = 0;

  const qs = new URLSearchParams({ pageSize: "50", role: "client" });
  if (q) qs.set("search", q);

  try {
    const [usersRes, statsRes, demandesRes] = await Promise.all([
      lasolutionFetchJson<UsersResponse>(`/admin/users?${qs}`),
      lasolutionFetchJson<UserStats>("/admin/users/stats"),
      lasolutionFetchJson<{ pagination: { total: number } }>("/admin/applications?pageSize=1"),
    ]);
    users = (usersRes.data || []).map(mapApiUser);
    stats = statsRes;
    demandes = demandesRes.pagination?.total ?? 0;
  } catch {
    /* backend indisponible */
  }

  return (
    <>
      <DashboardHeader
        title="Utilisateurs"
        subtitle="Gérez les comptes utilisateurs, Solupackers et points relais"
        session={session}
        rightSlot={
          <form method="GET">
            <label className="flex items-center gap-2 px-3 py-2 rounded-input border border-figma-tableBorder bg-white min-w-[200px] max-w-[280px] shadow-card focus-within:ring-2 focus-within:ring-figma-activeMenuText/20 focus-within:border-figma-activeMenuText/50 transition-shadow duration-fast">
              <SearchIcon className="w-4 h-4 text-[#777]" />
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Recherche"
                className="flex-1 bg-transparent text-sm text-figma-headerTitle placeholder:text-figma-adminSub outline-none"
              />
            </label>
          </form>
        }
      />
      <div className="flex-1 overflow-y-auto p-6 md:pl-[23px] md:pt-[26px]">
        <div className="flex flex-col gap-[30px] max-w-[1150px]">
          <section className="flex flex-row flex-wrap items-stretch gap-5">
            <StatCard
              value={String(stats.byRole.client ?? 0)}
              label="Clients"
              icon={<UsersCardIcon />}
              className="bg-[#E8F5E9] text-[#1B5E20]"
            />
            <StatCard
              value={String(stats.byRole.solupacker ?? 0)}
              label="Solupackers"
              icon={<DeliveryTruck width={24} height={24} className="shrink-0 text-figma-activeMenuText" strokeWidth={1.5} />}
              className="bg-[#FFE4E4] text-figma-activeMenuText"
            />
            <StatCard
              value={String(stats.byRole.relais ?? 0)}
              label="Points relais"
              icon={<MapPinCardIcon />}
              className="bg-[#E3F2FD] text-[#1565C0]"
            />
            <RequestBoxCard count={demandes} />
          </section>

          <section className="flex flex-col gap-3">
            <p className="text-sm text-figma-adminSub">
              {q ? `Résultats pour "${q}" — ` : ""}Choisissez un type ci-dessous ou utilisez les filtres.
            </p>
            <div className="flex flex-row flex-wrap items-center justify-between gap-4">
              <div className="flex flex-row rounded-input overflow-hidden border border-figma-tableBorder bg-figma-tableHeader shadow-card">
                <Tab href="/dashboard/utilisateurs" active>Utilisateurs</Tab>
                <Tab href="/dashboard/utilisateurs/solupackers">Solupackers</Tab>
                <Tab href="/dashboard/utilisateurs/points-relais">Points relais</Tab>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-figma-adminSub">{users.length} résultat{users.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
            <UtilisateursTable users={users} />
          </section>
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

function StatCard({ value, label, icon, className }: { value: string; label: string; icon: React.ReactNode; className: string }) {
  return (
    <article className={`flex flex-row justify-between items-center py-4 px-4 gap-3 min-h-[100px] flex-1 min-w-[180px] max-w-[270px] rounded-card shrink-0 shadow-card hover:shadow-cardHover transition-smooth duration-normal ${className}`}>
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/60 shrink-0">{icon}</div>
      <div className="flex flex-col items-end">
        <span className="font-extrabold text-2xl leading-tight">{value}</span>
        <span className="font-medium text-sm leading-[19px] opacity-90">{label}</span>
      </div>
    </article>
  );
}

function UsersCardIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#1B5E20]" aria-hidden>
      <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 20c0-3.5 2.5-6 6-6s6 2.5 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M21 19c0-2.2-1.4-4-3.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MapPinCardIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#1565C0]" aria-hidden>
      <path d="M12 21c3-3 7-6 7-11a7 7 0 10-14 0c0 5 4 8 7 11z" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function RequestBoxCard({ count }: { count: number }) {
  return (
    <Link href="/dashboard/demandes" className="flex flex-col items-center justify-center min-h-[100px] min-w-[140px] max-w-[180px] p-4 rounded-card bg-white border border-figma-tableBorder shadow-card hover:shadow-cardHover transition-smooth duration-normal">
      <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-white border border-figma-tableBorder">
        <BoxIcon className="w-6 h-6 text-figma-label" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-[#D6364E] text-white text-xs font-bold">
            {count}
          </span>
        )}
      </div>
      <span className="font-medium text-sm leading-[19px] text-figma-headerTitle mt-2">Boîte de demande</span>
    </Link>
  );
}

function BoxIcon({ className }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={`shrink-0 ${className ?? ""}`} aria-hidden>
      <path d="M4 8l8-4 8 4v8l-8 4-8-4V8z" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4 8l8 4 8-4M12 12v8" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function Tab({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} className={`px-4 py-2.5 text-sm font-medium transition-colors ${active ? "bg-figma-activeMenuText text-white" : "bg-transparent text-figma-headerTitle hover:bg-black/5"}`}>
      {children}
    </Link>
  );
}
