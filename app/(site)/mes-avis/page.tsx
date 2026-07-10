import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { Reveal } from "@/app/site/components/Reveal";
import { PageHeader } from "@/app/site/components/UI";
import { testimonialPhotoUrl } from "@/lib/testimonial-media";
import type { TestimonialStatus } from "@/lib/testimonial-client";

export type MesAvisRow = {
  id: string;
  orderId?: string | null;
  shippingRequestId?: string | null;
  clientName: string;
  city: string;
  country: string;
  message: string;
  rating: number | null;
  photoUrl: string | null;
  status: TestimonialStatus;
  rejectReason?: string | null;
  createdAt: string;
  updatedAt?: string;
  order?: { id: string; status: string; createdAt: string };
};

function Stars({ rating }: { rating: number | null }) {
  if (rating == null) return null;
  return (
    <p className="mt-2 text-xs text-amber-600" aria-label={`Note ${rating} sur 5`}>
      {"★".repeat(rating)}
      <span className="text-gray-300">{"★".repeat(5 - rating)}</span>
    </p>
  );
}

function sourceLabel(t: MesAvisRow) {
  if (t.shippingRequestId) {
    return `Expédition #${t.shippingRequestId.slice(0, 8)}`;
  }
  if (t.orderId) {
    return `Commande #${t.orderId.slice(0, 8)}`;
  }
  return "Avis";
}

export default async function MesAvisPage() {
  let rows: MesAvisRow[] = [];
  let loadError: string | null = null;
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3001";
    const proto = h.get("x-forwarded-proto") ?? "http";
    const res = await fetch(`${proto}://${host}/api/me/testimonials?pageSize=50`, {
      headers: { cookie: h.get("cookie") ?? "" },
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API ${res.status}: ${text.trim().slice(0, 300)}`);
    }
    const data = (await res.json()) as { data: MesAvisRow[] };
    rows = data.data ?? [];
  } catch (e) {
    rows = [];
    loadError = e instanceof Error ? e.message : "Impossible de charger vos avis.";
  }

  return (
    <main className="site-container site-section">
      <Reveal>
        <PageHeader
          eyebrow="Client"
          title="Mes avis"
          subtitle="Consultez vos témoignages laissés après livraison d'une commande ou d'une expédition."
          right={
            <div className="flex flex-wrap gap-2">
              <Link href="/mes-expeditions" className="btn btn-ghost">
                Mes expéditions
              </Link>
              <Link href="/mes-commandes" className="btn btn-ghost">
                Mes commandes
              </Link>
            </div>
          }
        />
      </Reveal>

      <div className="mt-10 grid gap-4">
        {loadError ? (
          <Reveal>
            <div className="card p-6 md:p-7 ring-1 ring-amber-200 bg-amber-50/80">
              <p className="text-sm font-semibold text-amber-950">Chargement impossible</p>
              <p className="mt-2 text-sm text-amber-900 leading-relaxed">{loadError}</p>
              <p className="mt-2 text-sm text-amber-900">
                Déconnectez-vous puis reconnectez-vous si le message mentionne un jeton expiré ou absent.
              </p>
            </div>
          </Reveal>
        ) : null}
        {!loadError && rows.length === 0 ? (
          <Reveal>
            <div className="card p-6 md:p-7">
              <p className="text-sm font-semibold text-gray-900">Vous n&apos;avez pas encore laissé d&apos;avis</p>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Une fois une commande ou une expédition livrée, ouvrez son suivi pour partager votre expérience.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/mes-expeditions" className="btn btn-primary inline-flex">
                  Voir mes expéditions
                </Link>
                <Link href="/mes-commandes" className="btn btn-ghost inline-flex">
                  Voir mes commandes
                </Link>
              </div>
            </div>
          </Reveal>
        ) : !loadError ? (
          rows.map((t, idx) => {
            const photo = testimonialPhotoUrl(t.photoUrl);
            const location = [t.city, t.country].filter(Boolean).join(", ");
            const isShipping = Boolean(t.shippingRequestId);
            const resourceId = isShipping ? t.shippingRequestId! : t.orderId!;
            const detailHref = isShipping ? "/mes-expeditions" : `/mes-commandes/${resourceId}`;
            const editHref = isShipping ? "/mes-expeditions" : `/mes-commandes/${resourceId}#avis`;
            const detailLabel = isShipping ? "Voir l'expédition" : "Voir la commande";
            const editLabel = isShipping ? "Modifier depuis Mes expéditions" : "Modifier";

            return (
              <Reveal key={t.id} delayMs={60 * idx}>
                <article className="card p-6 md:p-7">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex gap-4 min-w-0 flex-1">
                      {photo ? (
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-1 ring-black/10">
                          <Image src={photo} alt="" fill className="object-cover" sizes="56px" unoptimized />
                        </div>
                      ) : (
                        <div
                          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[rgba(195,35,83,0.12)] text-sm font-bold text-[var(--logo-red-dark)] ring-1 ring-[var(--logo-red)]/20"
                          aria-hidden
                        >
                          {t.clientName.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h2 className="text-base font-semibold text-gray-900">{t.clientName}</h2>
                        <p className="mt-1 text-sm text-gray-500">{location}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {sourceLabel(t)} · {new Date(t.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <Link href={detailHref} className="btn btn-ghost text-sm">
                        {detailLabel}
                      </Link>
                      {t.status !== "APPROVED" ? (
                        <Link href={editHref} className="btn btn-dark text-sm">
                          {editLabel}
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  <blockquote className="mt-4 text-sm text-gray-700 leading-relaxed border-l-2 border-[var(--logo-red)]/30 pl-4">
                    « {t.message} »
                  </blockquote>
                  {t.status !== "APPROVED" ? (
                    <p className="mt-2 text-xs text-gray-500">
                      Votre avis peut être modifié avant publication.
                    </p>
                  ) : null}
                  <Stars rating={t.rating} />
                </article>
              </Reveal>
            );
          })
        ) : null}
      </div>
    </main>
  );
}
