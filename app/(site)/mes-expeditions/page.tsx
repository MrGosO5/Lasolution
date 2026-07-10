import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { lasolutionFetchJson } from "@/lib/lasolution-api";
import { Reveal } from "@/app/site/components/Reveal";
import { PageHeader } from "@/app/site/components/UI";
import { MesExpeditionsFlash } from "./MesExpeditionsFlash";
import { MesExpeditionsTable, type MesExpeditionRow } from "./MesExpeditionsTable";
import { DEFAULT_SHIPPING_STATUS, type ClientExpeditionMeta } from "@/lib/shipping-expedition-client";
import type { OrderTestimonialData } from "@/app/site/components/OrderTestimonialBlock";

type MeShippingRequestEvent = {
  id: string;
  createdAt: string;
  meta: ClientExpeditionMeta | null;
  testimonial?: OrderTestimonialData | null;
};

type MeShippingRequestsResponse = { events: MeShippingRequestEvent[] };

function s(v: unknown): string {
  if (v == null) return "";
  return typeof v === "string" ? v : String(v);
}

function toRow(ev: MeShippingRequestEvent): MesExpeditionRow {
  const meta = ev.meta || {};
  return {
    id: ev.id,
    createdAt: ev.createdAt,
    transportMode: s(meta.transportMode),
    destinationCountry: s(meta.destinationCountry),
    destinationAddress: s(meta.destinationAddress),
    recipientName: s(meta.recipientName),
    recipientPhone: s(meta.recipientPhone),
    weightKg: s(meta.weightKg),
    trackingNumber: s(meta.trackingNumber),
    status: s(meta.status) || DEFAULT_SHIPPING_STATUS,
    shippedAt: meta.shippedAt ? s(meta.shippedAt) : null,
    meta,
    testimonial: ev.testimonial ?? null,
  };
}

export default async function MesExpeditionsPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "client") {
    return (
      <main className="site-container site-section">
        <Reveal>
          <PageHeader
            eyebrow="Client"
            title="Mes expéditions"
            subtitle="Consultez vos demandes d’expédition aérien et maritime."
          />
        </Reveal>
        <Reveal delayMs={120}>
          <div className="mt-10 card p-6 md:p-7">
            <p className="text-sm font-semibold text-gray-900">Accès réservé aux clients</p>
            <p className="mt-1 text-sm text-gray-600">
              Connectez-vous avec un compte client pour retrouver l’historique de vos demandes.
            </p>
            <div className="mt-4">
              <Link href="/connexion" className="btn btn-primary">
                Se connecter
              </Link>
            </div>
          </div>
        </Reveal>
      </main>
    );
  }

  let rows: MesExpeditionRow[] = [];
  let loadError: string | null = null;
  try {
    const res = await lasolutionFetchJson<MeShippingRequestsResponse>("/me/shipping-requests?limit=100");
    const events = Array.isArray(res.events) ? res.events : [];
    rows = events.map(toRow);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Impossible de charger vos demandes.";
  }

  const total = rows.length;
  const inProgress = rows.filter((r) => !["DELIVERED", "CANCELLED"].includes(r.status.toUpperCase())).length;

  return (
    <main className="site-container site-section">
      <Reveal>
        <PageHeader
          eyebrow="Client"
          title="Mes expéditions"
          subtitle="Suivez l’évolution de vos demandes : statut, messages de l’équipe et numéro de tracking."
          right={
            <Link href="/expedier-un-colis" className="btn btn-ghost">
              Nouvelle demande
            </Link>
          }
        />
      </Reveal>

      <div className="mt-10 grid gap-4">
        <Reveal>
          <MesExpeditionsFlash />
        </Reveal>

        <Reveal delayMs={60}>
          <div className="card p-6 md:p-7">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="grid gap-1">
                <p className="text-sm font-semibold text-gray-900">Demandes totales</p>
                <p className="text-3xl font-extrabold text-gray-900">{total}</p>
              </div>
              <div className="grid gap-1">
                <p className="text-sm font-semibold text-gray-900">En cours</p>
                <p className="text-3xl font-extrabold text-gray-900">{inProgress}</p>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delayMs={120}>
          {loadError ? (
            <div className="card p-6 md:p-7 ring-1 ring-amber-200 bg-amber-50/80">
              <p className="text-sm font-semibold text-amber-950">Chargement impossible</p>
              <p className="mt-2 text-sm text-amber-900 leading-relaxed">{loadError}</p>
            </div>
          ) : null}
          {!loadError && rows.length === 0 ? (
            <div className="card p-6 md:p-7">
              <p className="text-sm font-semibold text-gray-900">Aucune demande pour le moment</p>
              <p className="mt-1 text-sm text-gray-600">
                Créez votre première demande d’expédition en renseignant le colis et la destination.
              </p>
              <div className="mt-4">
                <Link href="/expedier-un-colis" className="btn btn-primary">
                  Expédier un colis
                </Link>
              </div>
            </div>
          ) : !loadError ? (
            <MesExpeditionsTable rows={rows} />
          ) : null}
        </Reveal>
      </div>
    </main>
  );
}
