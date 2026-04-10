import Link from "next/link";
import { Reveal } from "@/app/site/components/Reveal";
import { PageHeader, PrimaryButton, SecondaryButton } from "@/app/site/components/UI";

export default function DevenirPointRelaiPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-14 md:py-16">
      <Reveal>
        <PageHeader
          eyebrow="Partenaires"
          title="Devenez Partenaire Point Relai"
          subtitle="Un Point Relai est un acteur local essentiel de notre chaîne logistique entre l’Europe et l’Afrique. Il réceptionne les colis livrés par nos Solupackers et les remet aux clients finaux."
          right={
            <>
              <SecondaryButton href="/services">Voir les services</SecondaryButton>
              <PrimaryButton href="/devenir-point-relai/demande">Rejoignez-nous maintenant</PrimaryButton>
            </>
          }
        />
      </Reveal>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {[
          {
            t: "Proximité",
            d: "Un lieu sécurisé et accessible pour la remise des commandes aux clients.",
          },
          {
            t: "Fiabilité",
            d: "Des horaires flexibles et un point de contact de confiance pour la dernière étape.",
          },
          {
            t: "Impact local",
            d: "Vous participez à une chaîne logistique qui simplifie l’accès aux produits et aux envois.",
          },
        ].map((c, idx) => (
          <Reveal key={c.t} delayMs={70 * idx}>
            <div className="rounded-2xl bg-white/70 ring-1 ring-black/5 shadow-sm p-6 transition-smooth hover:shadow-lg hover:shadow-gray-200/40 hover:-translate-y-0.5">
              <p className="text-sm font-semibold text-gray-900">{c.t}</p>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{c.d}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delayMs={210}>
        <div className="mt-12 rounded-3xl bg-gradient-to-br from-white/85 to-white/55 ring-1 ring-black/5 shadow-xl shadow-gray-200/40 p-8 md:p-10">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Comment ça marche ?</h2>
          <ol className="mt-4 grid gap-2 text-sm text-gray-700 leading-relaxed list-decimal pl-5">
            <li>Vous soumettez votre demande en quelques étapes.</li>
            <li>Nous vérifions les informations et les documents.</li>
            <li>Après validation, vous recevez les colis et les remettez aux clients.</li>
          </ol>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href="/devenir-point-relai/demande"
              className="inline-flex items-center justify-center rounded-xl bg-[var(--logo-red)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--logo-red)]/20 transition-smooth hover:bg-[var(--logo-red-dark)]"
            >
              Démarrer la demande
            </Link>
            <Link
              href="/support"
              className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-gray-900 bg-white/75 ring-1 ring-black/5 shadow-sm transition-smooth hover:bg-white"
            >
              Contacter le support
            </Link>
          </div>
        </div>
      </Reveal>
    </main>
  );
}

