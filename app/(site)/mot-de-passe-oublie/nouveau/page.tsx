import Link from "next/link";
import { Suspense } from "react";
import { Reveal } from "@/app/site/components/Reveal";
import { PageHeader } from "@/app/site/components/UI";
import { ResetPasswordClient } from "../ResetPasswordClient";

export default function MotDePasseOublieNouveauPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-14 md:py-16">
      <Reveal>
        <PageHeader
          eyebrow="Compte"
          title="Nouveau mot de passe"
          subtitle="Choisissez un mot de passe fort. Si vous êtes arrivé depuis l’email de réinitialisation, le lien a prérempli votre jeton."
          right={
            <Link
              href="/connexion"
              className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-gray-900 bg-white/75 ring-1 ring-black/5 shadow-sm transition-smooth hover:bg-white"
            >
              Retour
            </Link>
          }
        />
      </Reveal>

      <Reveal delayMs={120}>
        <Suspense
          fallback={
            <div className="mt-10 rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-sm p-6 text-sm text-gray-600">Chargement…</div>
          }
        >
          <ResetPasswordClient />
        </Suspense>
      </Reveal>
    </main>
  );
}
