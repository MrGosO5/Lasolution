import Link from "next/link";
import { Reveal } from "@/app/site/components/Reveal";
import { PageHeader } from "@/app/site/components/UI";

export default function AnnulerCommandeConfirmationPage({ params }: { params: { id: string } }) {
  const id = params.id;
  return (
    <main className="site-container site-section max-w-3xl">
      <Reveal>
        <PageHeader
          eyebrow="Client"
          title="Commande annulée avec succès"
          subtitle="Votre commande a été annulée. Un éventuel remboursement sera traité sous 2 à 5 jours ouvrés."
        />
      </Reveal>

      <Reveal delayMs={120}>
        <div className="mt-10 card p-8 text-center">
          <p className="text-sm text-gray-700">Commande #{id}</p>
          <div className="mt-6">
            <Link
              href="/mes-commandes"
              className="btn btn-dark"
            >
              Continuer
            </Link>
          </div>
        </div>
      </Reveal>
    </main>
  );
}

