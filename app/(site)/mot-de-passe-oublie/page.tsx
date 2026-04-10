import Link from "next/link";
import { Reveal } from "@/app/site/components/Reveal";
import { PageHeader } from "@/app/site/components/UI";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export default function MotDePasseOubliePage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-14 md:py-16">
      <Reveal>
        <PageHeader
          eyebrow="Compte"
          title="Mot de passe oublié"
          subtitle="Entrez l’adresse e-mail associée à votre compte. Vous recevrez un code de réinitialisation sécurisé."
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
        <ForgotPasswordForm />
      </Reveal>
    </main>
  );
}
