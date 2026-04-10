import Link from "next/link";
import { notFound } from "next/navigation";
import { lasolutionFetchJson } from "@/lib/lasolution-api";
import { Reveal } from "@/app/site/components/Reveal";
import { PageHeader } from "@/app/site/components/UI";
import { ConfirmDeliveryButton } from "./ConfirmDeliveryButton";

type OrderSummary = {
  id: string;
  status: string;
  currency: string;
  lines: { description: string; quantity: number; unitPrice: string }[];
  parcels: { id: string; status: string }[];
};

export default async function ConfirmerLivraisonPage({ params }: { params: { id: string } }) {
  const id = params.id;

  let order: OrderSummary | null = null;
  try {
    order = await lasolutionFetchJson<OrderSummary>(`/orders/${encodeURIComponent(id)}`);
  } catch {
    order = null;
  }
  if (!order) return notFound();

  const alreadyDelivered = String(order.status).toUpperCase() === "DELIVERED";

  return (
    <main className="site-container site-section max-w-3xl">
      <Reveal>
        <PageHeader
          eyebrow="Client"
          title="Confirmer la réception de votre commande"
          subtitle={`Commande #${order.id.slice(0, 8).toUpperCase()}. Cette action confirme que vous avez bien reçu votre colis.`}
        />
      </Reveal>

      <Reveal delayMs={120}>
        <div className="mt-10 card p-8">
          <div className="grid gap-3 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Référence</span>
              <span className="font-semibold text-gray-900">#{order.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span>Statut</span>
              <span className="font-semibold text-gray-900">{order.status}</span>
            </div>
            <div className="flex justify-between">
              <span>Colis</span>
              <span className="font-semibold text-gray-900">{order.parcels.length}</span>
            </div>
          </div>

          {alreadyDelivered && (
            <div className="mt-5 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              Cette commande a déjà été marquée comme livrée.
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link href={`/mes-commandes/${id}`} className="btn btn-ghost">
              Non, retour
            </Link>
            {!alreadyDelivered && <ConfirmDeliveryButton orderId={id} />}
          </div>
        </div>
      </Reveal>
    </main>
  );
}
