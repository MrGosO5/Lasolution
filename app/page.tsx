import Link from "next/link";
import { Logo } from "./components/Logo";
import { Reveal } from "./site/components/Reveal";
import { SocialLinksRow } from "./site/components/SocialLinksRow";
import { ComingSoonWaitlistForm } from "./coming-soon/ComingSoonWaitlistForm";

export default function AccueilPage() {
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

                {/* CTA temporairement masqués */}
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

      <section className="mx-auto w-full max-w-6xl px-6 pb-16">
        <Reveal>
          <div className="rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-sm p-6 md:p-10">
            <ComingSoonWaitlistForm
              withFrame={false}
              className="mx-auto w-full max-w-[720px]"
            />
          </div>
        </Reveal>
      </section>

      {/* Bloc "Suivez votre commande..." temporairement masqué */}

      <section className="mx-auto w-full max-w-6xl px-6 pb-20">
        <Reveal>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Témoignages</h2>
          <p className="mt-2 text-sm text-gray-600">
            Faites vos achats ou envoyez un colis à vos proches en toute confiance, on s’occupe de tout.
          </p>
        </Reveal>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              name: "André",
              city: "Cotonou, Bénin",
              quote:
                "J’ai commandé un sac en Europe, et je l’ai reçu en 10 jours à Cotonou. Le suivi était clair, et le service client super réactif.",
            },
            {
              name: "Aïcha",
              city: "Lomé, Togo",
              quote:
                "Le service d’achat assisté est juste génial. Je choisis ce que je veux, ils commandent et je reçois tout sans stress.",
            },
            {
              name: "Hamid",
              city: "Paris, France",
              quote:
                "En tant que Solupacker, je gagne de l’argent en rentrant chez moi. L’application est bien faite, et les paiements sont rapides.",
            },
          ].map((t, idx) => (
            <Reveal key={t.name} delayMs={70 * idx}>
              <figure className="rounded-2xl bg-white/70 ring-1 ring-black/5 shadow-sm p-6 transition-smooth hover:shadow-lg hover:shadow-gray-200/40">
                <blockquote className="text-sm text-gray-700 leading-relaxed">“{t.quote}”</blockquote>
                <figcaption className="mt-4 text-sm font-semibold text-gray-900">
                  {t.name} <span className="font-normal text-gray-500">— {t.city}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}
