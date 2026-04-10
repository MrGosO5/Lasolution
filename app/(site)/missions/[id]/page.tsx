import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { lasolutionFetchJson } from "@/lib/lasolution-api";
import { Reveal } from "@/app/site/components/Reveal";
import { PageHeader } from "@/app/site/components/UI";

type MissionDetail = {
  id: string;
  status: string;
  createdAt: string;
  packerUserId: string;
  announcement: {
    id: string;
    title: string;
    status: string;
    body: Record<string, unknown>;
  };
};

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:   { label: "En attente",   color: "#C09A00", bg: "#FFF9CA" },
  PROPOSED:  { label: "Proposée",     color: "#1565C0", bg: "#E3F2FD" },
  ACCEPTED:  { label: "Acceptée",     color: "#218922", bg: "#B4FFB5" },
  REFUSED:   { label: "Refusée",      color: "#A31F1F", bg: "#FFB4B4" },
  COMPLETED: { label: "Terminée",     color: "#4F46E5", bg: "#EEF2FF" },
};

export default async function MissionDetailPage({ params }: { params: { id: string } }) {
  const id = params.id;

  let mission: MissionDetail | null = null;
  try {
    mission = await lasolutionFetchJson<MissionDetail>(`/missions/${encodeURIComponent(id)}`);
  } catch {
    mission = null;
  }
  if (!mission) return notFound();

  const body = (mission.announcement?.body as Record<string, unknown>) || {};
  const route = String(body.route ?? "—");
  const weight = body.parcelWeightKg != null ? `${body.parcelWeightKg} kg` : "—";
  const commission = body.commissionEur != null ? `${body.commissionEur} €` : "—";
  const deadline = body.deadline ? String(body.deadline) : "—";
  const createdAt = new Date(mission.createdAt);

  const st = String(mission.status).toUpperCase();
  const statusInfo = STATUS_LABELS[st] ?? { label: mission.status, color: "#4F46E5", bg: "#EEF2FF" };

  const canAccept  = ["PENDING", "PROPOSED"].includes(st);
  const canRefuse  = ["PENDING", "PROPOSED", "ACCEPTED"].includes(st);
  const canReceive = st === "ACCEPTED";
  const canRecover = st === "ACCEPTED";

  return (
    <main className="site-container site-section">
      <Reveal>
        <PageHeader
          eyebrow="SoluPacker"
          title={`Détails mission — #${mission.id.slice(0, 8).toUpperCase()}`}
          subtitle={mission.announcement?.title ?? `Mission #${id}`}
          right={
            <Link href="/missions" className="btn btn-ghost">
              Retour
            </Link>
          }
        />
      </Reveal>

      <div className="mt-10 grid gap-6 md:grid-cols-[1fr_0.85fr]">
        <Reveal>
          <div className="card p-6 md:p-7">
            <div className="flex items-center justify-between gap-6">
              <p className="text-sm font-semibold text-gray-900">Informations générales</p>
              <span
                className="text-xs font-semibold rounded-full px-3 py-1"
                style={{ color: statusInfo.color, background: statusInfo.bg }}
              >
                {statusInfo.label}
              </span>
            </div>

            <div className="mt-4 grid gap-3 text-sm">
              {[
                ["Référence", `#${mission.id.slice(0, 8).toUpperCase()}`],
                ["Annonce", mission.announcement?.title ?? "—"],
                ["Trajet", route],
                ["Poids colis", weight],
                ["Commission", commission],
                ["Date création", createdAt.toLocaleDateString("fr-FR")],
                ["Date limite", deadline],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-6">
                  <span className="text-gray-600">{k}</span>
                  <span className="font-semibold text-gray-900 text-right">{v}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/missions/${id}/accept`}
                className={`btn btn-primary${canAccept ? "" : " pointer-events-none opacity-40"}`}
                aria-disabled={!canAccept}
              >
                Accepter
              </Link>
              <Link
                href={`/missions/${id}/refuse`}
                className={`btn btn-ghost${canRefuse ? "" : " pointer-events-none opacity-40"}`}
                aria-disabled={!canRefuse}
              >
                Refuser
              </Link>
              <Link
                href={`/missions/${id}/reception`}
                className={`btn btn-dark${canReceive ? "" : " pointer-events-none opacity-40"}`}
                aria-disabled={!canReceive}
              >
                Confirmer réception
              </Link>
              <Link
                href={`/missions/${id}/recuperation`}
                className={`btn btn-ghost${canRecover ? "" : " pointer-events-none opacity-40"}`}
                aria-disabled={!canRecover}
              >
                Demander récupération
              </Link>
            </div>
          </div>
        </Reveal>

        <Reveal delayMs={120}>
          <div className="rounded-3xl bg-gradient-to-br from-white/85 to-white/55 ring-1 ring-black/5 shadow-xl shadow-gray-200/40 p-6 md:p-7">
            <p className="text-xs font-semibold tracking-wide text-gray-600 uppercase">Aperçu</p>
            <div className="mt-4 relative h-40 w-full">
              <Image src="/icon/bicycle.svg" alt="Transport" fill className="object-contain" />
            </div>
            <div className="mt-4 card bg-white/80 p-5">
              <p className="text-sm font-semibold text-gray-900">Actions rapides</p>
              <ul className="mt-2 text-sm text-gray-600 list-disc list-inside space-y-1">
                <li className={canAccept ? "text-gray-800 font-medium" : "opacity-40"}>Accepter la mission</li>
                <li className={canRefuse ? "text-gray-800 font-medium" : "opacity-40"}>Refuser la mission</li>
                <li className={canReceive ? "text-gray-800 font-medium" : "opacity-40"}>Confirmer réception colis</li>
                <li className={canRecover ? "text-gray-800 font-medium" : "opacity-40"}>Demander une récupération</li>
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
