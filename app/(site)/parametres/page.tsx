import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { lasolutionFetchJson } from "@/lib/lasolution-api";
import { Reveal } from "@/app/site/components/Reveal";
import { PageHeader } from "@/app/site/components/UI";
import { ParametresForm } from "./ParametresForm";

export default async function ParametresPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=" + encodeURIComponent("/parametres"));
  }

  let profile: Record<string, unknown> | null = null;
  try {
    const me = await lasolutionFetchJson<{ profile?: Record<string, unknown> | null }>("/me");
    profile = me.profile ?? null;
  } catch {
    profile = null;
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-14 md:py-16">
      <Reveal>
        <PageHeader
          eyebrow="Mon espace"
          title="Paramètres"
          subtitle="Gérez votre sécurité, votre langue et votre devise."
        />
      </Reveal>

      <ParametresForm initialProfile={profile} />
    </main>
  );
}
