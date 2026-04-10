import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { lasolutionFetchJson } from "@/lib/lasolution-api";
import { Reveal } from "@/app/site/components/Reveal";
import { PageHeader } from "@/app/site/components/UI";
import { OrderTestimonialPrompt } from "@/app/site/components/OrderTestimonialPrompt";

type OrderDetail = {
  id: string;
  status: string;
  type: string;
  currency: string;
  deliveryMode: string | null;
  createdAt: string;
  lines: { description: string; quantity: number; unitPrice: string; currency: string }[];
  parcels: { id: string; status: string; createdAt: string }[];
  testimonial?: { id: string; createdAt: string } | null;
};

export default async function CommandeDetailPage({ params }: { params: { id: string } }) {
  const id = params.id;
  let order: OrderDetail | null = null;
  try {
    order = await lasolutionFetchJson<OrderDetail>(`/orders/${encodeURIComponent(id)}`);
  } catch {
    order = null;
  }
  if (!order) return notFound();

  const orderDelivered =
    String(order.status).toUpperCase() === "DELIVERED" ||
    (Array.isArray(order.parcels) &&
      order.parcels.length > 0 &&
      order.parcels.every((p) => String(p.status).toUpperCase() === "DELIVERED"));
  const testimonialSubmitted = Boolean(order.testimonial?.id);

  const subtotal = (order.lines || []).reduce((acc, l) => acc + Number(l.unitPrice) * Number(l.quantity), 0);
  const createdAt = new Date(order.createdAt);
  return (
    <main className="site-container site-section">
      <Reveal>
        <PageHeader
          eyebrow="Client"
          title={`Détails — #${order.id.slice(0, 8)}`}
          subtitle="Suivi de commande et informations générales. Les frais peuvent être précisés à mesure de l’avancement."
          right={
            <Link
              href="/mes-commandes"
              className="btn btn-ghost"
            >
              Retour
            </Link>
          }
        />
      </Reveal>

      <div className="mt-10 grid gap-6 md:grid-cols-[1fr_0.85fr]">
        <Reveal>
          <div className="card p-6 md:p-7">
            <p className="text-sm font-semibold text-gray-900">Informations générales</p>
            <div className="mt-4 grid gap-3 text-sm">
              {[
                ["Référence", `#${order.id.slice(0, 8)}`],
                ["Date de commande", createdAt.toLocaleDateString("fr-FR")],
                ["Statut", order.status],
                ["Type", order.type],
                ["Devise", order.currency],
                ["Mode de livraison", order.deliveryMode || "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-6">
                  <span className="text-gray-600">{k}</span>
                  <span className="font-semibold text-gray-900 text-right">{v}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 card bg-white/80 p-5">
              <p className="text-sm font-semibold text-gray-900">Suivi de commande</p>
              <div className="mt-4 grid gap-3">
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--logo-red)]/80" />
                    <span className="text-sm text-gray-700">Statut actuel</span>
                  </div>
                  <span className="text-xs font-semibold rounded-full bg-[rgba(195,35,83,0.12)] px-3 py-1 text-[var(--logo-red-dark)]">
                    {order.status}
                  </span>
                </div>

                {(order.parcels || []).slice(0, 3).map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                      <span className="h-2.5 w-2.5 rounded-full bg-gray-900/30" />
                      <span className="text-sm text-gray-700">Colis #{p.id.slice(0, 8)}</span>
                    </div>
                    <span className="text-xs font-semibold rounded-full bg-black/5 px-3 py-1 text-gray-800">{p.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                className="btn btn-dark"
              >
                Exporter
              </button>
              <Link
                href={`/mes-commandes/${order.id}/annuler`}
                className="btn btn-ghost"
              >
                Annuler la commande
              </Link>
            </div>

            <OrderTestimonialPrompt
              orderId={order.id}
              orderDelivered={orderDelivered}
              testimonialSubmitted={testimonialSubmitted}
            />

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link
                href={`/mes-commandes/${order.id}/payer-expedition`}
                className="btn btn-primary"
              >
                Payer l’expédition → 49.99€
              </Link>
              <Link
                href={`/mes-commandes/${order.id}/payer-livraison`}
                className="btn btn-dark"
              >
                Payer la livraison → 49.99€
              </Link>
            </div>

            <div className="mt-4">
              <Link
                href={`/mes-commandes/${order.id}/confirmer-livraison`}
                className="btn btn-ghost"
              >
                Confirmer la livraison
              </Link>
            </div>
          </div>
        </Reveal>

        <Reveal delayMs={120}>
          <div className="rounded-3xl bg-gradient-to-br from-white/85 to-white/55 ring-1 ring-black/5 shadow-xl shadow-gray-200/40 p-6 md:p-7">
            <p className="text-xs font-semibold tracking-wide text-gray-600 uppercase">Détails produits</p>
            <div className="mt-4 grid gap-3 text-sm">
              {(order.lines || []).map((l, idx) => (
                <div key={`${l.description}-${idx}`} className="rounded-2xl bg-white/80 ring-1 ring-black/5 p-4 text-gray-700">
                  {l.description} / Qté : {l.quantity} / Pu : {Number(l.unitPrice).toLocaleString("fr-FR", { maximumFractionDigits: 2 })}{" "}
                  {l.currency}
                </div>
              ))}
            </div>
            <div className="mt-5 h-px bg-black/5" />
            <div className="mt-5 grid gap-3 text-sm">
              {[
                ["Sous-total", `${subtotal.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} ${order.currency}`],
                ["Frais d’expédition", "À préciser"],
                ["Frais de livraison", "À préciser"],
                ["Total TTC", `${subtotal.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} ${order.currency}`],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-gray-600">{k}</span>
                  <span className="font-semibold text-gray-900">{v}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 relative h-24 w-full">
              <Image src="/icon/livraisonconfirmée.png" alt="Livraison" fill className="object-contain" />
            </div>
          </div>
        </Reveal>
      </div>
    </main>
  );
}

