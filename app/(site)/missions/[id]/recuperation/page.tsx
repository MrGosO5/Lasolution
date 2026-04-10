import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/app/site/components/Reveal";
import { PageHeader } from "@/app/site/components/UI";
import { MissionRecuperationForm } from "./MissionRecuperationForm";

export default function RecuperationPage({ params }: { params: { id: string } }) {
  const id = params.id;
  return (
    <main className="site-container site-section max-w-4xl">
      <Reveal>
        <PageHeader
          eyebrow="SoluPacker"
          title="Récupération de colis"
          subtitle="Signalez une indisponibilité et demandez une reprise du colis."
          right={
            <Link href={`/missions/${id}`} className="btn btn-ghost">
              Retour
            </Link>
          }
        />
      </Reveal>

      <div className="mt-10 grid gap-6 md:grid-cols-[1fr_0.85fr]">
        <Reveal>
          <MissionRecuperationForm missionId={id} />
        </Reveal>

        <Reveal delayMs={120}>
          <div className="rounded-3xl bg-gradient-to-br from-white/85 to-white/55 ring-1 ring-black/5 shadow-xl shadow-gray-200/40 p-6 md:p-7">
            <p className="text-xs font-semibold tracking-wide text-gray-600 uppercase">Aperçu</p>
            <div className="mt-4 relative h-28 w-full">
              <Image src="/icon/mission_refuse.png" alt="Récupération" fill className="object-contain" />
            </div>
            <p className="mt-4 text-sm text-gray-600">Décrivez la situation précisément pour accélérer le traitement.</p>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
