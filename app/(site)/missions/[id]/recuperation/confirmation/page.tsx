import Link from "next/link";
import { Reveal } from "@/app/site/components/Reveal";
import { PageHeader } from "@/app/site/components/UI";

export default function RecuperationConfirmationPage({ params }: { params: { id: string } }) {
  const id = params.id;
  return (
    <main className="site-container site-section max-w-3xl">
      <Reveal>
        <PageHeader
          eyebrow="SoluPacker"
          title="Opération de récupération lancée"
          subtitle={`Vous venez de lancer une opération de récupération pour la mission #${id}. Vous serez contacté(e) sous peu.`}
        />
      </Reveal>

      <Reveal delayMs={120}>
        <div className="mt-10 card p-8 text-center">
          <p className="text-sm text-gray-700">
            Merci. Une notification vous informera de la suite du processus.
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

