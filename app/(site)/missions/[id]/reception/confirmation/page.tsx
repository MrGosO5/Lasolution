import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/app/site/components/Reveal";
import { PageHeader } from "@/app/site/components/UI";

export default function ReceptionConfirmationPage({ params }: { params: { id: string } }) {
  const id = params.id;
  return (
    <main className="site-container site-section max-w-3xl">
      <Reveal>
        <PageHeader
          eyebrow="SoluPacker"
          title="Confirmation de réception de colis"
          subtitle={`Vous venez de confirmer la réception du colis pour la mission #${id}.`}
        />
      </Reveal>

      <Reveal delayMs={120}>
        <div className="mt-10 card p-8 text-center">
          <div className="mx-auto relative h-28 w-28">
            <Image src="/icon/livraisonconfirmée.png" alt="Confirmation" fill className="object-contain" />
          </div>
          <p className="mt-4 text-sm text-gray-700">
            Merci. Vous recevrez une notification pour les prochaines étapes.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/missions/${id}`}
              className="btn btn-dark"
            >
              Retour mission
            </Link>
            <Link
              href="/missions"
              className="btn btn-ghost"
            >
              Voir mes missions
            </Link>
          </div>
        </div>
      </Reveal>
    </main>
  );
}

