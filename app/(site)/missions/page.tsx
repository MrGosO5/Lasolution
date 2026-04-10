import Link from "next/link";
import { lasolutionFetchJson } from "@/lib/lasolution-api";
import { Reveal } from "@/app/site/components/Reveal";
import { PageHeader } from "@/app/site/components/UI";

export default function MissionsPage() {
  return <MissionsPageInner />;
}

type MissionRow = {
  id: string;
  status: string;
  createdAt: string;
  announcement: {
    id: string;
    title: string;
    body: any;
  };
};

async function MissionsPageInner() {
  let rows: MissionRow[] = [];
  try {
    const res = await lasolutionFetchJson<{ data: MissionRow[] }>("/missions?page=1&pageSize=50");
    rows = res.data ?? [];
  } catch {
    rows = [];
  }

  const total = rows.length;
  const thisMonthCommissions = rows.reduce((acc, m) => acc + Number(m.announcement?.body?.commissionEur ?? 0), 0);

  return (
    <main className="site-container site-section">
      <Reveal>
        <PageHeader
          eyebrow="SoluPacker"
          title="Mes Missions"
          subtitle="Consultez vos missions, leur statut, et les commissions associées."
        />
      </Reveal>

      <div className="mt-10 grid gap-4">
        <Reveal>
          <div className="card p-6 md:p-7">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <p className="text-sm font-semibold text-gray-900">Missions totales</p>
                <p className="mt-1 text-3xl font-extrabold text-gray-900">{total}</p>
              </div>
              <div className="card bg-white/80 px-5 py-4">
                <p className="text-xs font-semibold tracking-wide text-gray-600 uppercase">Commissions (ce mois)</p>
                <p className="mt-1 text-2xl font-extrabold text-gray-900">
                  € {thisMonthCommissions.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delayMs={120}>
          <div className="card overflow-hidden">
            <div className="p-4 md:p-5 bg-black/[0.02] border-b border-black/5">
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <input
                  placeholder="Rechercher une mission"
                  className="h-11 w-full rounded-xl bg-white/80 ring-1 ring-black/10 px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[rgb(214_54_78/0.25)]"
                />
                <button
                  type="button"
                  className="btn btn-dark"
                >
                  Filtrer
                </button>
              </div>
            </div>

            {rows.length === 0 ? (
              <div className="p-6 md:p-7">
                <p className="text-sm font-semibold text-gray-900">Aucune mission pour le moment</p>
                <p className="mt-1 text-sm text-gray-600">
                  Les missions apparaissent ici uniquement quand elles sont créées côté opérations (seed explicite ou backend).
                </p>
              </div>
            ) : (
              <div className="grid">
                <div className="grid grid-cols-[1.2fr_1.3fr_1fr_0.8fr_0.6fr] gap-2 px-5 py-3 text-xs font-semibold text-gray-600 uppercase bg-black/[0.02] border-b border-black/5">
                  <span>Réf</span>
                  <span>Annonce</span>
                  <span>Date</span>
                  <span>Statut</span>
                  <span>Action</span>
                </div>
                {rows.map((m) => {
                  const date = new Date(m.createdAt);
                  return (
                    <div
                      key={m.id}
                      className="grid grid-cols-[1.2fr_1.3fr_1fr_0.8fr_0.6fr] gap-2 px-5 py-4 text-sm border-b border-black/5 hover:bg-black/[0.02]"
                    >
                      <span className="font-semibold text-gray-900">#{m.id.slice(0, 8)}</span>
                      <span className="text-gray-700">{m.announcement?.title ?? "—"}</span>
                      <span className="text-gray-700">{date.toLocaleDateString("fr-FR")}</span>
                      <span className="text-gray-700">{m.status}</span>
                      <Link className="text-gray-900 font-semibold hover:underline" href={`/missions/${m.id}`}>
                        Détails
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </main>
  );
}

