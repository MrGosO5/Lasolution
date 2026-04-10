import { Reveal } from "@/app/site/components/Reveal";
import { PageHeader } from "@/app/site/components/UI";

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-14 md:py-16">
      <Reveal>
        <PageHeader
          eyebrow="Légal"
          title="Politique de confidentialité"
          subtitle="Nous protégeons vos données et n’utilisons vos informations que pour fournir le service. Ce contenu peut être ajusté par votre équipe juridique."
        />
      </Reveal>

      <div className="mt-10 grid gap-4 text-sm text-gray-700 leading-relaxed">
        {[
          {
            h: "1. Données collectées",
            p: "Nous collectons les informations nécessaires à la création de compte, au suivi des commandes/colis et au support (ex: nom, email, téléphone, adresse).",
          },
          {
            h: "2. Finalités",
            p: "Traitement des commandes, expédition, notifications, prévention de fraude, assistance client et amélioration de l’expérience.",
          },
          {
            h: "3. Conservation",
            p: "Les données sont conservées le temps nécessaire au service et selon les obligations légales applicables. Vous pouvez demander la suppression selon les conditions.",
          },
          {
            h: "4. Partage",
            p: "Vos données peuvent être partagées avec des partenaires logistiques et prestataires techniques (paiement, email) uniquement pour exécuter le service.",
          },
          {
            h: "5. Sécurité",
            p: "Mesures techniques et organisationnelles visant à protéger vos données contre l’accès non autorisé et la perte.",
          },
          {
            h: "6. Vos droits",
            p: "Accès, rectification, opposition, suppression, portabilité selon la réglementation en vigueur. Contactez le support pour exercer vos droits.",
          },
        ].map((s, idx) => (
          <Reveal key={s.h} delayMs={70 * idx}>
            <section className="rounded-2xl bg-white/70 ring-1 ring-black/5 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-900">{s.h}</h2>
              <p className="mt-2">{s.p}</p>
            </section>
          </Reveal>
        ))}
      </div>
    </main>
  );
}

