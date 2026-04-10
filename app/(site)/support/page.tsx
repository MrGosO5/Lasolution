import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Reveal } from "@/app/site/components/Reveal";
import { PageHeader } from "@/app/site/components/UI";
import { SupportContactForm } from "./SupportContactForm";

export default async function SupportPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const isClient = role === "client";
  const defaultName = session?.user?.name?.trim() || "";
  const defaultEmail = session?.user?.email?.trim() || "";

  return (
    <main className="site-container site-section">
      <Reveal>
        <PageHeader
          eyebrow="Support"
          title="Support client"
          subtitle="Une question sur une commande, un colis, un paiement ou un compte ? Contactez-nous et nous vous répondrons rapidement."
          right={
            <Link
              className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-gray-900 bg-white/75 ring-1 ring-black/5 shadow-sm transition-smooth hover:bg-white"
              href="/faq"
            >
              Voir la FAQ
            </Link>
          }
        />
      </Reveal>

      <div className="mt-10 grid gap-6 md:grid-cols-[1fr_0.85fr]">
        <Reveal>
          <SupportContactForm defaultName={defaultName} defaultEmail={defaultEmail} />
        </Reveal>

        <Reveal delayMs={120}>
          <div className="rounded-3xl bg-gradient-to-br from-white/85 to-white/55 ring-1 ring-black/5 shadow-xl shadow-gray-200/40 p-6 md:p-7">
            <h2 className="text-sm font-semibold text-gray-900">Conseils rapides</h2>
            <ul className="mt-3 grid gap-2 text-sm text-gray-600 leading-relaxed list-disc pl-5">
              <li>Ajoutez la référence commande/colis si vous l’avez.</li>
              <li>Précisez le mode d’expédition (aérien/maritime) et la destination.</li>
              <li>Si c’est un paiement: indiquez le montant et la date.</li>
            </ul>
            <div className="mt-6 rounded-2xl bg-white/80 ring-1 ring-black/5 p-5">
              <p className="text-xs font-semibold tracking-wide text-gray-600 uppercase">Accès rapide</p>
              <div className="mt-3 grid gap-2">
                {isClient ? (
                  <>
                    <Link className="text-sm font-semibold text-gray-900 hover:underline" href="/mes-commandes">
                      Mes commandes
                    </Link>
                    <Link className="text-sm font-semibold text-gray-900 hover:underline" href="/notifications">
                      Notifications
                    </Link>
                    <Link className="text-sm font-semibold text-gray-900 hover:underline" href="/parametres">
                      Paramètres
                    </Link>
                  </>
                ) : (
                  <Link className="text-sm font-semibold text-gray-900 hover:underline" href="/connexion">
                    Se connecter
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </main>
  );
}

