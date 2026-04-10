import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { lasolutionFetchJson } from "@/lib/lasolution-api";
import { DashboardHeader } from "../../components/DashboardHeader";

type ApiUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  profile: Record<string, unknown> | null;
};

function Tab({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} className={`px-4 py-2.5 text-sm font-medium transition-colors ${active ? "bg-figma-activeMenuText text-white" : "bg-transparent text-figma-headerTitle hover:bg-black/5"}`}>
      {children}
    </Link>
  );
}

export default async function SolupackersPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await getServerSession(authOptions);
  const q = String(searchParams.q || "").trim();

  let users: ApiUser[] = [];
  let total = 0;

  const qs = new URLSearchParams({ pageSize: "50", role: "solupacker" });
  if (q) qs.set("search", q);

  try {
    const res = await lasolutionFetchJson<{ data: ApiUser[]; pagination: { total: number } }>(`/admin/users?${qs}`);
    users = res.data || [];
    total = res.pagination?.total ?? 0;
  } catch { /* backend indisponible */ }

  return (
    <>
      <DashboardHeader
        title="Solupackers"
        subtitle="Gestion des comptes Solupacker"
        session={session}
        rightSlot={
          <form method="GET">
            <label className="flex items-center gap-2 px-3 py-2 rounded-input border border-figma-tableBorder bg-white min-w-[200px] max-w-[280px] shadow-card focus-within:ring-2 focus-within:ring-figma-activeMenuText/20 transition-shadow duration-fast">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#777]" aria-hidden>
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input type="search" name="q" defaultValue={q} placeholder="Recherche" className="flex-1 bg-transparent text-sm text-figma-headerTitle placeholder:text-figma-adminSub outline-none" />
            </label>
          </form>
        }
      />
      <div className="flex-1 overflow-y-auto p-6 md:pl-[23px] md:pt-[26px]">
        <div className="flex flex-col gap-[30px] max-w-[1150px]">
          <div className="flex flex-row flex-wrap items-center justify-between gap-4">
            <div className="flex flex-row rounded-input overflow-hidden border border-figma-tableBorder bg-figma-tableHeader shadow-card">
              <Tab href="/dashboard/utilisateurs">Utilisateurs</Tab>
              <Tab href="/dashboard/utilisateurs/solupackers" active>Solupackers</Tab>
              <Tab href="/dashboard/utilisateurs/points-relais">Points relais</Tab>
            </div>
            <span className="text-xs text-figma-adminSub">{total} solupacker{total !== 1 ? "s" : ""}</span>
          </div>

          <div className="border border-figma-tableBorder rounded-card overflow-hidden bg-white shadow-card">
            <table className="w-full">
              <thead>
                <tr className="bg-figma-tableHeader border-b border-figma-tableBorder">
                  {["Nom", "Prénoms", "Email", "Pays", "Date d'inscription", "Missions"].map((h) => (
                    <th key={h} className="text-left font-semibold text-sm text-figma-headerTitle py-3.5 px-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 px-4 text-center text-sm text-figma-adminSub">
                      {q ? `Aucun résultat pour "${q}".` : "Aucun solupacker pour le moment."}
                    </td>
                  </tr>
                ) : users.map((u) => {
                  const parts = (u.name || u.email).split(" ");
                  const prenoms = parts[0] ?? "";
                  const nom = parts.slice(1).join(" ") || "—";
                  const pays = String((u.profile as Record<string, unknown>)?.country ?? "—");
                  return (
                    <tr key={u.id} className="border-b border-figma-tableRowBorder last:border-0 bg-white hover:bg-figma-tableRowHover transition-colors duration-fast">
                      <td className="py-3 px-4 text-sm font-medium text-figma-headerTitle">{nom}</td>
                      <td className="py-3 px-4 text-sm text-figma-headerTitle">{prenoms}</td>
                      <td className="py-3 px-4 text-sm text-figma-headerTitle">{u.email}</td>
                      <td className="py-3 px-4 text-sm text-figma-headerTitle">{pays}</td>
                      <td className="py-3 px-4 text-sm text-figma-headerTitle">{new Date(u.createdAt).toLocaleDateString("fr-FR")}</td>
                      <td className="py-3 px-4 text-sm text-figma-adminSub">—</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
