import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { lasolutionFetchJson } from "@/lib/lasolution-api";
import { roleForPartnerSpace, titleForPartnerSpace } from "@/lib/partner-routes";
import type { AppRole } from "@/types/app-role";
import { AcceptJobButton } from "./AcceptJobButton";

type Props = { params: { space: string } };

// ─── Types ───────────────────────────────────────────────────────────────────

type DeliveryJob = {
  id: string;
  status: string;
  createdAt: string;
  parcel?: {
    id: string;
    weightKg?: number | null;
    order?: { id: string; status: string } | null;
  } | null;
};

type DriverShift = {
  id: string;
  startAt: string;
  endAt: string;
  zoneId?: string | null;
};

type CommissionsDay = Record<string, { credits: number; count: number }>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatDateShort(iso: string) {
  try {
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatEur(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

// ─── Sous-pages par rôle ──────────────────────────────────────────────────────

async function LivreurPage({ email }: { email: string }) {
  let jobs: DeliveryJob[] = [];
  let shifts: DriverShift[] = [];

  try {
    const r = await lasolutionFetchJson<{ data: DeliveryJob[] }>("/delivery-jobs");
    jobs = r.data ?? [];
  } catch {
    /* backend indisponible */
  }

  try {
    const r = await lasolutionFetchJson<{ data: DriverShift[] }>("/me/shifts");
    shifts = r.data ?? [];
  } catch {
    /* backend indisponible */
  }

  return (
    <main className="min-h-screen bg-figma-page px-6 py-12">
      <div className="mx-auto max-w-2xl flex flex-col gap-6">

        {/* En-tête */}
        <div className="rounded-card border border-figma-cardBorder bg-figma-card p-6 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-figma-adminSub">Espace Solu Livreur</p>
          <h1 className="mt-1 text-2xl font-bold text-figma-headerTitle">Bienvenue</h1>
          <p className="mt-1 text-sm text-figma-adminSub">
            Connecté en tant que <span className="font-medium text-figma-label">{email}</span>
          </p>
        </div>

        {/* Courses disponibles */}
        <section className="rounded-card border border-figma-cardBorder bg-figma-card shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-figma-tableBorder bg-figma-tableHeader">
            <h2 className="font-semibold text-base text-figma-headerTitle">Courses disponibles</h2>
            <p className="text-xs text-figma-adminSub mt-0.5">Colis en attente d&apos;un livreur.</p>
          </div>
          {jobs.length === 0 ? (
            <p className="px-5 py-8 text-sm text-figma-adminSub text-center">Aucune course disponible pour le moment.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-figma-tableHeader border-b border-figma-tableBorder">
                  <th className="text-left text-xs font-semibold text-figma-headerTitle px-4 py-2.5">Colis</th>
                  <th className="text-left text-xs font-semibold text-figma-headerTitle px-4 py-2.5">Poids</th>
                  <th className="text-left text-xs font-semibold text-figma-headerTitle px-4 py-2.5">Créé le</th>
                  <th className="text-left text-xs font-semibold text-figma-headerTitle px-4 py-2.5">Action</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b border-figma-tableRowBorder last:border-0 hover:bg-figma-tableRowHover">
                    <td className="px-4 py-3 text-sm font-mono text-figma-headerTitle">{job.parcel?.id?.slice(0, 8).toUpperCase() ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-figma-adminSub">
                      {job.parcel?.weightKg != null ? `${job.parcel.weightKg} kg` : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-figma-adminSub">{formatDate(job.createdAt)}</td>
                    <td className="px-4 py-3">
                      <AcceptJobButton jobId={job.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Mes créneaux */}
        <section className="rounded-card border border-figma-cardBorder bg-figma-card shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-figma-tableBorder bg-figma-tableHeader">
            <h2 className="font-semibold text-base text-figma-headerTitle">Mes créneaux de disponibilité</h2>
            <p className="text-xs text-figma-adminSub mt-0.5">Vos prochains créneaux planifiés.</p>
          </div>
          {shifts.length === 0 ? (
            <p className="px-5 py-8 text-sm text-figma-adminSub text-center">Aucun créneau planifié.</p>
          ) : (
            <ul className="divide-y divide-figma-tableRowBorder">
              {shifts.map((s) => (
                <li key={s.id} className="px-5 py-3 text-sm flex justify-between items-center">
                  <span className="text-figma-headerTitle font-medium">{formatDate(s.startAt)}</span>
                  <span className="text-figma-adminSub">→ {formatDate(s.endAt)}</span>
                  {s.zoneId && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{s.zoneId}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Liens rapides */}
        <nav className="grid gap-3" aria-label="Raccourcis">
          <Link
            href="/mon-espace"
            className="flex items-center justify-between rounded-input border border-figma-tableBorder bg-figma-tableHeader px-4 py-3 text-sm font-semibold text-figma-headerTitle hover:bg-white/80 transition-smooth"
          >
            Hub Mon espace
            <span aria-hidden className="text-figma-adminSub">→</span>
          </Link>
        </nav>
      </div>
    </main>
  );
}

async function AmbassadeurPage({ email }: { email: string }) {
  let commissions: CommissionsDay = {};
  let rawCount = 0;

  try {
    const r = await lasolutionFetchJson<{ data: CommissionsDay; rawCount: number }>("/me/commissions/daily");
    commissions = r.data ?? {};
    rawCount = r.rawCount ?? 0;
  } catch {
    /* backend indisponible */
  }

  const days = Object.entries(commissions).sort(([a], [b]) => (a < b ? 1 : -1));
  const totalRevenu = days.reduce((sum, [, d]) => sum + d.credits, 0);

  return (
    <main className="min-h-screen bg-figma-page px-6 py-12">
      <div className="mx-auto max-w-2xl flex flex-col gap-6">

        {/* En-tête */}
        <div className="rounded-card border border-figma-cardBorder bg-figma-card p-6 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-figma-adminSub">Espace Ambassadeur</p>
          <h1 className="mt-1 text-2xl font-bold text-figma-headerTitle">Mes commissions</h1>
          <p className="mt-1 text-sm text-figma-adminSub">
            Connecté en tant que <span className="font-medium text-figma-label">{email}</span>
          </p>
        </div>

        {/* Résumé 30 jours */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-card border border-figma-cardBorder bg-figma-card p-5 shadow-card">
            <p className="text-xs text-figma-adminSub font-medium uppercase tracking-wide">Total 30 jours</p>
            <p className="mt-2 text-2xl font-extrabold text-figma-headerTitle">{formatEur(totalRevenu)}</p>
          </div>
          <div className="rounded-card border border-figma-cardBorder bg-figma-card p-5 shadow-card">
            <p className="text-xs text-figma-adminSub font-medium uppercase tracking-wide">Nb de transactions</p>
            <p className="mt-2 text-2xl font-extrabold text-figma-headerTitle">{rawCount}</p>
          </div>
        </div>

        {/* Détail par jour */}
        <section className="rounded-card border border-figma-cardBorder bg-figma-card shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-figma-tableBorder bg-figma-tableHeader">
            <h2 className="font-semibold text-base text-figma-headerTitle">Détail par jour</h2>
            <p className="text-xs text-figma-adminSub mt-0.5">30 derniers jours.</p>
          </div>
          {days.length === 0 ? (
            <p className="px-5 py-8 text-sm text-figma-adminSub text-center">Aucune commission sur la période.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-figma-tableHeader border-b border-figma-tableBorder">
                  <th className="text-left text-xs font-semibold text-figma-headerTitle px-4 py-2.5">Date</th>
                  <th className="text-right text-xs font-semibold text-figma-headerTitle px-4 py-2.5">Transactions</th>
                  <th className="text-right text-xs font-semibold text-figma-headerTitle px-4 py-2.5">Montant</th>
                </tr>
              </thead>
              <tbody>
                {days.map(([day, d]) => (
                  <tr key={day} className="border-b border-figma-tableRowBorder last:border-0 hover:bg-figma-tableRowHover">
                    <td className="px-4 py-3 text-sm text-figma-headerTitle">{formatDateShort(day)}</td>
                    <td className="px-4 py-3 text-sm text-figma-adminSub text-right">{d.count}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-figma-headerTitle text-right">{formatEur(d.credits)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Liens rapides */}
        <nav className="grid gap-3" aria-label="Raccourcis">
          <Link
            href="/mon-espace"
            className="flex items-center justify-between rounded-input border border-figma-tableBorder bg-figma-tableHeader px-4 py-3 text-sm font-semibold text-figma-headerTitle hover:bg-white/80 transition-smooth"
          >
            Hub Mon espace
            <span aria-hidden className="text-figma-adminSub">→</span>
          </Link>
        </nav>
      </div>
    </main>
  );
}

// ─── Page générique (relais, solupacker) ──────────────────────────────────────

const quickLinks: Partial<Record<AppRole, { href: string; label: string }[]>> = {
  solupacker: [
    { href: "/mon-espace", label: "Hub Mon espace" },
    { href: "/missions", label: "Mes missions" },
    { href: "/prochain-voyage", label: "Déclarer un voyage" },
  ],
  relais: [
    { href: "/mon-espace", label: "Hub Mon espace" },
    { href: "/devenir-point-relai", label: "Programme point relais" },
  ],
};

function GenericPartnerPage({
  email,
  title,
  role,
}: {
  email: string;
  title: string;
  role: AppRole;
}) {
  const links = quickLinks[role] ?? [{ href: "/mon-espace", label: "Mon espace" }];

  return (
    <main className="min-h-screen bg-figma-page px-6 py-12">
      <div className="mx-auto max-w-2xl rounded-card border border-figma-cardBorder bg-figma-card p-8 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-wide text-figma-adminSub">{title}</p>
        <h1 className="mt-2 text-2xl font-bold text-figma-headerTitle">Espace partenaire</h1>
        <p className="mt-2 text-sm text-figma-adminSub">
          Connecté en tant que <span className="font-medium text-figma-label">{email}</span> — rôle{" "}
          <span className="font-mono text-xs text-figma-adminSub">{role}</span>.
        </p>

        <nav className="mt-8 grid gap-3" aria-label="Raccourcis partenaire">
          {links.map((l) => (
            <Link
              key={l.href + l.label}
              href={l.href}
              className="flex items-center justify-between rounded-input border border-figma-tableBorder bg-figma-tableHeader px-4 py-3 text-sm font-semibold text-figma-headerTitle transition-smooth hover:bg-white/80"
            >
              {l.label}
              <span aria-hidden className="text-figma-adminSub">→</span>
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export default async function PartnerSpacePage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=" + encodeURIComponent(`/partenaire/${params.space}`));

  const required = roleForPartnerSpace(params.space);
  if (!required) redirect("/login");

  const role = session.user.role as AppRole;
  if (role !== required) {
    if (role === "admin") redirect("/dashboard");
    if (role === "client") redirect("/espace-client");
    redirect("/login");
  }

  const email = session.user.email ?? "";
  const title = titleForPartnerSpace(params.space);

  if (required === "solu_livreur") return <LivreurPage email={email} />;
  if (required === "ambassadeur") return <AmbassadeurPage email={email} />;

  return <GenericPartnerPage email={email} title={title} role={required} />;
}
