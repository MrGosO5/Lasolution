import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Reveal } from "@/app/site/components/Reveal";
import { PageHeader } from "@/app/site/components/UI";
import { SiteSignOutButton } from "@/app/site/components/SiteSignOutButton";

export default async function ComptePage() {
  const session = await getServerSession(authOptions);
  const isClient = session?.user?.role === "client";

  if (session?.user?.id && isClient) {
    redirect("/mon-espace");
  }

  return (
    <main className="site-container site-section">
      <Reveal>
        <PageHeader
          eyebrow="Compte"
          title="Mon compte"
          subtitle="Gérez votre profil, suivez vos commandes et retrouvez vos réglages."
          right={
            session?.user?.id ? (
              <SiteSignOutButton className="btn btn-ghost">Déconnexion</SiteSignOutButton>
            ) : (
              <Link href="/connexion" className="btn btn-primary">
                Se connecter
              </Link>
            )
          }
        />
      </Reveal>

      {!session?.user?.id ? (
        <div className="mt-10 card p-6 md:p-7">
          <p className="text-sm font-semibold text-gray-900">Connectez-vous pour accéder à votre compte</p>
          <p className="mt-1 text-sm text-gray-600">
            Pour voir vos commandes et gérer votre profil, vous devez être connecté.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <Link className="btn btn-primary" href="/connexion">
              Se connecter
            </Link>
            <Link className="btn btn-ghost" href="/inscription">
              Créer un compte
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-10 card p-6 md:p-7">
          <p className="text-sm font-semibold text-gray-900">Compte e-commerce indisponible</p>
          <p className="mt-1 text-sm text-gray-600">
            Cet espace est réservé aux clients. Utilisez <span className="font-medium">Mon espace</span> pour un tableau
            adapté à votre rôle.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <Link className="btn btn-primary" href="/mon-espace">
              Mon espace
            </Link>
            <Link className="btn btn-ghost" href="/">
              Retour accueil
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

