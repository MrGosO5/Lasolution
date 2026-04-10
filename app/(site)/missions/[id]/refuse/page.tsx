import Link from "next/link";
import { notFound } from "next/navigation";
import { lasolutionFetchJson } from "@/lib/lasolution-api";
import { Reveal } from "@/app/site/components/Reveal";
import { PageHeader } from "@/app/site/components/UI";
import { RefuseMissionButton } from "./RefuseMissionButton";

type MissionSummary = {
  id: string;
  status: string;
  announcement: { title: string };
};

export default async function MissionRefusePage({ params }: { params: { id: string } }) {
  const id = params.id;

  let mission: MissionSummary | null = null;
  try {
    mission = await lasolutionFetchJson<MissionSummary>(`/missions/${encodeURIComponent(id)}`);
  } catch {
    mission = null;
  }
  if (!mission) return notFound();

  const st = String(mission.status).toUpperCase();
  const canRefuse = ["PENDING", "PROPOSED", "ACCEPTED"].includes(st);

  return (
    <main className="site-container site-section max-w-3xl">
      <Reveal>
        <PageHeader
          eyebrow="SoluPacker"
          title="Refuser cette mission ?"
          subtitle={mission.announcement?.title ?? `Mission #${id}`}
        />
      </Reveal>

      <Reveal delayMs={120}>
        <div className="mt-10 card p-8">
          <div className="grid gap-2 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Référence</span>
              <span className="font-semibold text-gray-900">#{mission.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span>Statut actuel</span>
              <span className="font-semibold text-gray-900">{mission.status}</span>
            </div>
          </div>

          {!canRefuse ? (
            <div className="mt-5 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
              Cette mission ne peut plus être refusée (statut : {mission.status}).
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-600">
              Pas de souci. D'autres missions vous seront proposées selon vos voyages déclarés.
            </p>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link href={`/missions/${id}`} className="btn btn-ghost">
              Annuler
            </Link>
            {canRefuse && <RefuseMissionButton missionId={id} />}
          </div>
        </div>
      </Reveal>
    </main>
  );
}
