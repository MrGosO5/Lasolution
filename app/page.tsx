import Link from "next/link";
import { getServerSession } from "next-auth";
import { Logo } from "./components/Logo";
import { Reveal } from "./site/components/Reveal";
import { SocialLinksRow } from "./site/components/SocialLinksRow";
import { ComingSoonWaitlistForm } from "./coming-soon/ComingSoonWaitlistForm";
import { PublicTestimonialsSection } from "@/app/site/components/PublicTestimonialsSection";
import { authOptions } from "@/lib/auth";
import { partnerPathByRole } from "@/lib/partner-routes";
import type { AppRole } from "@/types/app-role";

/** Témoignages issus de la BDD — pas de cache page statique (5 min avant). */
export const revalidate = 0;

function accountHrefForRole(role: AppRole | undefined): string {
  if (role === "admin") return "/dashboard";
  if (role === "client") return "/mon-espace";
  const partnerPath = role ? partnerPathByRole[role] : undefined;
  return partnerPath ?? "/mon-espace";
}

export default async function AccueilPage() {
  const session = await getServerSession(authOptions);
  const isAuthed = Boolean(session?.user?.id);
  const accountHref = accountHrefForRole(session?.user?.role as AppRole | undefined);
  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(900px_circle_at_20%_15%,rgba(195,35,83,0.20),transparent_55%),radial-gradient(700px_circle_at_80%_30%,rgba(99,102,241,0.18),transparent_55%),radial-gradient(800px_circle_at_50%_80%,rgba(236,72,153,0.12),transparent_55%)]" />
        <div className="mx-auto w-full max-w-6xl px-6 pt-6 relative z-10">
          <Link href="/" className="inline-block focus-ring rounded-xl">
            <span className="sr-only">La Solution — accueil</span>
            <Logo />
          </Link>
        </div>
        <div className="mx-auto w-full max-w-6xl px-6 py-10 md:py-16 relative">
          <div className="grid items-center gap-10 md:grid-cols-[1.2fr_0.8fr]">
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

                <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-1">
                  {isAuthed ? (
                    <Link href={accountHref} className="btn btn-primary">
                      Mon espace
                    </Link>
                  ) : (
                    <>
                      <Link href="/connexion" className="btn btn-primary">
                        Se connecter
                      </Link>
                      <Link href="/inscription" className="btn btn-ghost">
                        S&apos;inscrire
                      </Link>
                    </>
                  )}
                </div>

                <SocialLinksRow className="pt-2" />
              </div>
            </Reveal>

            <Reveal delayMs={120}>
              <div className="relative">
                <div className="absolute -inset-4 rounded-[28px] bg-gradient-to-br from-[rgba(195,35,83,0.25)] via-[rgba(236,72,153,0.15)] to-[rgba(99,102,241,0.15)] blur-2xl" />
                <div className="relative rounded-[24px] bg-white/70 backdrop-blur-sm shadow-xl shadow-gray-200/50 ring-1 ring-black/5 p-6 md:p-7">
                  <p className="text-sm font-semibold text-gray-900">Recevez des notifications à chaque étape</p>
                  <div className="mt-4 grid gap-3">
                    {[
                      "Vous venez de valider un paiement de 25,00€ pour un achat de bluetooth sur Amazon",
                      "Commande expédiée : votre commande #12345 est en cours d’expédition",
                      "Paiement effectué : votre paiement de 52,00€ pour la commande #14578 a été validé",
                    ].map((t, i) => (
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
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-14 md:py-16">
        <Reveal>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            Une solution rapide, fiable pour transporter ou acheter depuis l’Europe vers l’Afrique.
          </h2>
        </Reveal>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            { title: "Achat assisté", desc: "Vous commandez, on achète et on vous livre." },
            { title: "Paiement", desc: "Payez en toute sécurité depuis l’Afrique pour vos achats." },
            { title: "Suivi en temps réel", desc: "Suivez votre commande à chaque étape." },
            { title: "Support client intégré", desc: "Un support réactif pour toutes vos questions." },
          ].map((c, idx) => (
            <Reveal key={c.title} delayMs={80 * idx}>
              <div className="rounded-2xl bg-white/70 ring-1 ring-black/5 shadow-sm p-6 transition-smooth hover:shadow-lg hover:shadow-gray-200/40 hover:-translate-y-0.5">
                <p className="text-sm font-semibold text-gray-900">{c.title}</p>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{c.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="relative z-20 mx-auto w-full max-w-6xl px-6 pb-16">
        <Reveal>
          <div className="rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-sm p-6 md:p-10 overflow-visible">
            <ComingSoonWaitlistForm
              withFrame={false}
              className="mx-auto w-full max-w-[720px]"
            />
          </div>
        </Reveal>
      </section>

      {/* Bloc "Suivez votre commande..." temporairement masqué */}

      <PublicTestimonialsSection />
    </main>
  );
}
