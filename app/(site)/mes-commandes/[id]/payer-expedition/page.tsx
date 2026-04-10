import Link from "next/link";
import { Reveal } from "@/app/site/components/Reveal";
import { PageHeader } from "@/app/site/components/UI";

export default function PayerExpeditionPage({ params }: { params: { id: string } }) {
  const id = params.id;
  return (
    <main className="site-container site-section max-w-4xl">
      <Reveal>
        <PageHeader
          eyebrow="Client"
          title="Payer l’expédition"
          subtitle="Les frais d’expédition sont prêts. Vous pouvez payer maintenant pour déclencher l’expédition."
          right={
            <Link
              href={`/mes-commandes/${id}`}
              className="btn btn-ghost"
            >
              Retour
            </Link>
          }
        />
      </Reveal>

      <Reveal delayMs={120}>
        <div className="mt-10 card p-6 md:p-7">
          <div className="grid gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Commande</span>
              <span className="font-semibold text-gray-900">#{id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Frais d’expédition</span>
              <span className="font-extrabold text-gray-900">—</span>
            </div>
            <p className="text-xs text-gray-500">
              Le montant sera affiché lorsque le calcul des frais sera disponible.
            </p>
          </div>
          <Link
            href={`/mes-commandes/${id}`}
            className="mt-6 w-full btn btn-primary"
          >
            Payer l’expédition
          </Link>
        </div>
      </Reveal>
    </main>
  );
}

