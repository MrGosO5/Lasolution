import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/app/site/components/Reveal";
import { PageHeader } from "@/app/site/components/UI";
import { MissionReceptionForm } from "./MissionReceptionForm";

export default function MissionReceptionPage({ params }: { params: { id: string } }) {
  const id = params.id;
  return (
    <main className="site-container site-section max-w-4xl">
      <Reveal>
        <PageHeader
          eyebrow="SoluPacker"
          title="Réception de colis"
          subtitle={`Confirmation de réception pour la mission #${id}.`}
          right={
            <Link href={`/missions/${id}`} className="btn btn-ghost">
              Retour
            </Link>
          }
        />
      </Reveal>

      <div className="mt-10 grid gap-6 md:grid-cols-[1fr_0.85fr]">
        <Reveal>
          <MissionReceptionForm missionId={id} />
        </Reveal>

        <Reveal delayMs={120}>
          <div className="rounded-3xl bg-gradient-to-br from-white/85 to-white/55 ring-1 ring-black/5 shadow-xl shadow-gray-200/40 p-6 md:p-7">
            <p className="text-xs font-semibold tracking-wide text-gray-600 uppercase">Rappel</p>
            <p className="mt-2 text-sm text-gray-700">
              Prenez une photo claire du colis et décrivez les anomalies pour protéger votre commission.
            </p>
            <div className="mt-5 relative h-28 w-full">
              <Image src="/icon/cropde.png" alt="Colis" fill className="object-contain" />
            </div>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
