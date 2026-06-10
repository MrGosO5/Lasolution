import { Reveal } from "@/app/site/components/Reveal";
import { PageHeader } from "@/app/site/components/UI";

export default function ConditionsGeneralesPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-14 md:py-16">
      <Reveal>
        <PageHeader
          eyebrow="Légal"
          title="Conditions générales d’utilisation et de vente"
          subtitle="Contenu juridique provisoire — à valider par votre équipe juridique avant mise en production."
        />
      </Reveal>

      <div className="mt-10 grid gap-4 text-sm text-gray-700 leading-relaxed">
        {[
          {
            h: "1. Objet",
            p: "Les présentes conditions encadrent l’utilisation de la plateforme La Solution (achat assisté, expédition de colis, services logistiques Europe → Afrique).",
          },
          {
            h: "2. Compte utilisateur",
            p: "L’utilisateur s’engage à fournir des informations exactes et à préserver la confidentialité de ses identifiants.",
          },
          {
            h: "3. Commandes et paiements",
            p: "Toute commande implique l’acceptation du prix, des délais indicatifs et des modalités de livraison communiquées au moment de la validation.",
          },
          {
            h: "4. Expédition et livraison",
            p: "Les délais peuvent varier selon le mode d’expédition (aérien, maritime) et les contraintes douanières. Le suivi est disponible dans l’espace client.",
          },
          {
            h: "5. Responsabilité",
            p: "La Solution met en œuvre les moyens raisonnables pour exécuter le service. Les limitations de responsabilité seront précisées dans la version définitive.",
          },
          {
            h: "6. Contact",
            p: "Pour toute question : page Support client ou contact indiqué sur le site.",
          },
        ].map((block) => (
          <section key={block.h}>
            <h2 className="text-base font-semibold text-gray-900">{block.h}</h2>
            <p className="mt-2">{block.p}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
