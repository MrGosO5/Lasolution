import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Reveal } from "@/app/site/components/Reveal";
import { PageHeader } from "@/app/site/components/UI";

export default async function CommandesAliasPage() {
  const session = await getServerSession(authOptions);
  const isClient = session?.user?.role === "client";
  const href = isClient ? "/mes-commandes" : "/connexion";
  const label = isClient ? "Ouvrir Mes commandes" : "Se connecter";

  return (
    <main className="site-container site-section">
      <Reveal>
        <PageHeader
          eyebrow="Client"
          title="Commandes"
          subtitle="Accédez à votre historique de commandes."
        />
      </Reveal>
      <Reveal delayMs={120}>
        <div className="mt-10 rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-sm p-8 text-center">
          <p className="text-sm text-gray-700">
            {isClient ? "Ouvrez votre historique." : "Connectez-vous pour accéder à votre historique."}
          </p>
          <div className="mt-6">
            <Link
              href={href}
              className="btn btn-primary"
            >
              {label}
            </Link>
          </div>
        </div>
      </Reveal>
    </main>
  );
}

