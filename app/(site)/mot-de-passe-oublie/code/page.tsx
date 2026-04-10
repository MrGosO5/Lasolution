import Link from "next/link";
import { Reveal } from "@/app/site/components/Reveal";
import { PageHeader } from "@/app/site/components/UI";

export default function MotDePasseOublieCodePage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-14 md:py-16">
      <Reveal>
        <PageHeader
          eyebrow="Compte"
          title="Réinitialisation par email"
          subtitle="La réinitialisation se fait par un lien sécurisé envoyé à votre adresse. Vous n’avez pas besoin de saisir de code à 6 chiffres."
          right={
            <Link
              href="/mot-de-passe-oublie"
              className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-gray-900 bg-white/75 ring-1 ring-black/5 shadow-sm transition-smooth hover:bg-white"
            >
              Retour
            </Link>
          }
        />
      </Reveal>

      <Reveal delayMs={120}>
        <div className="mt-10 rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-sm p-6 md:p-7 grid gap-4 text-sm text-gray-700">
          <p>
            Ouvrez l’email « Réinitialisation de votre mot de passe La Solution » et cliquez sur le lien. Il vous mène
            directement vers la page pour choisir un nouveau mot de passe.
          </p>
          <p className="text-xs text-gray-500">
            Le lien expire au bout d’une heure. Si vous ne voyez rien, refaites une demande depuis la page précédente.
          </p>
          <Link
            href="/mot-de-passe-oublie/nouveau"
            className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-[var(--logo-red)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--logo-red)]/20 transition-smooth hover:bg-[var(--logo-red-dark)]"
          >
            Aller à la page nouveau mot de passe
          </Link>
        </div>
      </Reveal>
    </main>
  );
}
