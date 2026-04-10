import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { lasolutionFetchJson } from "@/lib/lasolution-api";
import { Reveal } from "@/app/site/components/Reveal";
import { PageHeader } from "@/app/site/components/UI";
import { MonProfilForm, type MePayload } from "./MonProfilForm";

export default async function MonProfilPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=" + encodeURIComponent("/mon-profil"));
  }

  let me: MePayload | null = null;
  try {
    me = await lasolutionFetchJson<MePayload>("/me");
  } catch {
    me = null;
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-14 md:py-16">
      <Reveal>
        <PageHeader
          eyebrow="Mon espace"
          title="Mon profil"
          subtitle="Mettez à jour vos informations pour faciliter les livraisons, notifications et paiements."
        />
      </Reveal>

      <MonProfilForm
        initial={me}
        fallbackEmail={session.user.email ?? ""}
        fallbackName={session.user.name ?? ""}
      />
    </main>
  );
}
