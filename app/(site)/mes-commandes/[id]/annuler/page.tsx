import Link from "next/link";
import { notFound } from "next/navigation";
import { lasolutionFetchJson } from "@/lib/lasolution-api";
import { Reveal } from "@/app/site/components/Reveal";
import { PageHeader } from "@/app/site/components/UI";
import { CancelOrderButton } from "./CancelOrderButton";

type OrderSummary = {
  id: string;
  status: string;
  currency: string;
  lines: { description: string; quantity: number; unitPrice: string }[];
};

export default async function AnnulerCommandePage({ params }: { params: { id: string } }) {
  const id = params.id;

  let order: OrderSummary | null = null;
  try {
    order = await lasolutionFetchJson<OrderSummary>(`/orders/${encodeURIComponent(id)}`);
  } catch {
    order = null;
  }
  if (!order) return notFound();

  const canCancel = !["CANCELLED", "DELIVERED"].includes(String(order.status).toUpperCase());
  const subtotal = (order.lines || []).reduce(
    (acc, l) => acc + Number(l.unitPrice) * Number(l.quantity),
    0
  );

  return (
    <main className="site-container site-section max-w-3xl">
      <Reveal>
        <PageHeader
          eyebrow="Client"
          title="Voulez-vous vraiment annuler votre commande ?"
          subtitle="Cette action est irréversible. Le remboursement dépendra de l'état d'avancement de votre commande."
        />
      </Reveal>

      <Reveal delayMs={120}>
        <div className="mt-10 card p-8">
          <p className="text-sm font-semibold text-gray-900">Récapitulatif</p>
          <div className="mt-4 grid gap-2 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Référence</span>
              <span className="font-semibold text-gray-900">#{order.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span>Statut actuel</span>
              <span className="font-semibold text-gray-900">{order.status}</span>
            </div>
            <div className="flex justify-between">
              <span>Montant estimé</span>
              <span className="font-semibold text-gray-900">
                {new Intl.NumberFormat("fr-FR", { style: "currency", currency: order.currency || "EUR" }).format(subtotal)}
              </span>
            </div>
          </div>

          {!canCancel && (
            <div className="mt-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              Cette commande ne peut plus être annulée (statut : {order.status}).
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link href={`/mes-commandes/${id}`} className="btn btn-ghost">
              Non, retour
            </Link>
            {canCancel && <CancelOrderButton orderId={id} />}
          </div>
        </div>
      </Reveal>
    </main>
  );
}
