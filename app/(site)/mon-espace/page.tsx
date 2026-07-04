import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Reveal } from "@/app/site/components/Reveal";
import { PageHeader } from "@/app/site/components/UI";
import { ClientEspaceHub } from "@/app/site/components/ClientEspaceHub";
import { SoluPackerEspaceHub } from "@/app/site/components/SoluPackerEspaceHub";
import { PartnerEspaceHub } from "@/app/site/components/PartnerEspaceHub";
import type { AppRole } from "@/types/app-role";

export default async function MonEspacePage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as AppRole | undefined;

  if (!session?.user?.id) {
    return (
      <main className="site-container site-section">
        <Reveal>
          <PageHeader
            eyebrow="Espace connecté"
            title="Mon espace"
            subtitle="Connectez-vous pour suivre vos commandes, vos missions ou votre activité partenaire."
            right={
              <>
                <Link href="/connexion" className="btn btn-primary">
                  Se connecter
                </Link>
                <Link href="/inscription" className="btn btn-ghost hidden sm:inline-flex">
                  Créer un compte
                </Link>
              </>
            }
          />
        </Reveal>
        <div className="mt-10 card p-6 md:p-7">
          <p className="text-sm font-semibold text-gray-900">Accès réservé aux comptes La Solution</p>
          <p className="mt-1 text-sm text-gray-600">
            Clients, SoluPackers et partenaires disposent chacun d’un tableau de bord adapté après connexion.
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
      </main>
    );
  }

  if (role === "admin") {
    redirect("/dashboard");
  }

  if (role === "client") {
    return (
      <main className="site-container site-section">
        <Reveal>
          <PageHeader
            eyebrow="Espace client"
            title="Mon espace"
            subtitle="Commandes, profil, carte et paramètres au même endroit."
          />
        </Reveal>
        <ClientEspaceHub session={session} />
      </main>
    );
  }

  if (role === "solupacker") {
    return (
      <main className="site-container site-section">
        <Reveal>
          <PageHeader
            eyebrow="SoluPacker"
            title="Mon espace"
            subtitle="Déclarez vos trajets, gérez vos missions et suivez vos commissions."
          />
        </Reveal>
        <SoluPackerEspaceHub />
      </main>
    );
  }

  if (role === "relais" || role === "solu_livreur" || role === "ambassadeur") {
    return (
      <main className="site-container site-section">
        <Reveal>
          <PageHeader
            eyebrow="Partenaire"
            title="Mon espace"
            subtitle="Accédez à votre espace dédié et à vos notifications."
          />
        </Reveal>
        <PartnerEspaceHub role={role} />
      </main>
    );
  }

  return (
    <main className="site-container site-section">
      <Reveal>
        <PageHeader title="Mon espace" subtitle="Rôle non reconnu pour cet écran." />
      </Reveal>
      <div className="mt-10 card p-6 md:p-7">
        <Link className="btn btn-primary" href="/">
          Retour accueil
        </Link>
      </div>
    </main>
  );
}
