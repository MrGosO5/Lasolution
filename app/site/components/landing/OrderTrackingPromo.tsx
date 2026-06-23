"use client";

import { TrackedLink } from "@/app/site/components/landing/TrackedLink";
import { Reveal } from "@/app/site/components/Reveal";

const STEPS = [
  { label: "Paiement validé", desc: "Confirmation instantanée de votre achat ou expédition." },
  { label: "Expédition", desc: "Votre colis quitte l’entrepôt avec suivi activé." },
  { label: "Transit", desc: "Mises à jour à chaque étape jusqu’à l’Afrique." },
  { label: "Livraison", desc: "Remise au point relais ou au destinataire final." },
];

type Props = {
  isClient: boolean;
};

export function OrderTrackingPromo({ isClient }: Props) {
  const trackingHref = isClient ? "/mes-commandes" : "/connexion?callbackUrl=%2Fmes-commandes";

  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-14 md:pb-16">
      <Reveal>
        <div className="rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-sm p-6 md:p-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Suivez votre commande</h2>
          <p className="mt-2 text-sm text-gray-600 max-w-2xl">
            Consultez l’avancement de vos achats et colis en temps réel, de la validation du paiement à la livraison.
          </p>

          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, idx) => (
              <li
                key={step.label}
                className="relative rounded-2xl bg-white/90 px-4 py-4 ring-1 ring-black/5"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(195,35,83,0.12)] text-xs font-bold text-[var(--logo-red-dark)]">
                  {idx + 1}
                </span>
                <p className="mt-2 text-sm font-semibold text-gray-900">{step.label}</p>
                <p className="mt-1 text-xs text-gray-600 leading-relaxed">{step.desc}</p>
              </li>
            ))}
          </ol>

          <div className="mt-8">
            <TrackedLink href={trackingHref} className="btn btn-primary" event="landing_cta_tracking">
              {isClient ? "Voir mes commandes" : "Suivre une commande"}
            </TrackedLink>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
