import { Reveal } from "@/app/site/components/Reveal";
import { SocialLinksRow } from "@/app/site/components/SocialLinksRow";
import { LandingCtaGroup } from "@/app/site/components/landing/LandingCtaGroup";
import type { AppRole } from "@/types/app-role";

const NOTIFICATION_SAMPLES = [
  "Vous venez de valider un paiement de 25,00€ pour un achat de bluetooth sur Amazon",
  "Commande expédiée : votre commande #12345 est en cours d’expédition",
  "Paiement effectué : votre paiement de 52,00€ pour la commande #14578 a été validé",
];

type Props = {
  role?: AppRole;
  isAuthed: boolean;
  showNotificationDemo: boolean;
};

export function LandingHeroSection({ role, isAuthed, showNotificationDemo }: Props) {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(900px_circle_at_20%_15%,rgba(195,35,83,0.20),transparent_55%),radial-gradient(700px_circle_at_80%_30%,rgba(99,102,241,0.18),transparent_55%),radial-gradient(800px_circle_at_50%_80%,rgba(236,72,153,0.12),transparent_55%)]" />
      <div className="mx-auto w-full max-w-6xl px-6 py-10 md:py-16 relative">
        <div
          className={`grid items-center gap-10 ${showNotificationDemo ? "md:grid-cols-[1.2fr_0.8fr]" : ""}`}
        >
          <Reveal>
            <div className="flex flex-col gap-6">
              <p className="inline-flex w-fit items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-black/5">
                Votre passerelle logistique
                <span className="h-1 w-1 rounded-full bg-[var(--logo-red)]" />
                Europe → Afrique
              </p>

              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-[1.05]">
                Votre passerelle d’expédition de colis et d’achat assisté
              </h1>

              <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-xl">
                Faites vos achats ou envoyez un colis à vos proches en toute confiance, on s’occupe de tout.
              </p>

              <LandingCtaGroup role={role} isAuthed={isAuthed} />
              <SocialLinksRow className="pt-2" />
            </div>
          </Reveal>

          {showNotificationDemo ? (
            <Reveal delayMs={120}>
              <div className="relative">
                <div className="absolute -inset-4 rounded-[28px] bg-gradient-to-br from-[rgba(195,35,83,0.25)] via-[rgba(236,72,153,0.15)] to-[rgba(99,102,241,0.15)] blur-2xl" />
                <div className="relative rounded-[24px] bg-white/70 backdrop-blur-sm shadow-xl shadow-gray-200/50 ring-1 ring-black/5 p-6 md:p-7">
                  <p className="text-sm font-semibold text-gray-900">Recevez des notifications à chaque étape</p>
                  <div className="mt-4 grid gap-3">
                    {NOTIFICATION_SAMPLES.map((t, i) => (
                      <div
                        key={t}
                        className={[
                          "rounded-2xl bg-white/90 px-4 py-3 text-sm text-gray-700 shadow-sm ring-1 ring-black/5 transition-smooth",
                          i === 0 ? "animate-float-slow" : "",
                          i === 1 ? "animate-float-slow [animation-delay:800ms]" : "",
                          i === 2 ? "animate-float-slow [animation-delay:1600ms]" : "",
                        ].join(" ")}
                      >
                        {t}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          ) : null}
        </div>
      </div>
    </section>
  );
}
