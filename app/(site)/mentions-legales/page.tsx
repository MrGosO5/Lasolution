import { Reveal } from "@/app/site/components/Reveal";
import { PageHeader } from "@/app/site/components/UI";

export default function MentionsLegalesPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-14 md:py-16">
      <Reveal>
        <PageHeader
          eyebrow="Légal"
          title="Mentions légales"
          subtitle="Contenu juridique provisoire — à compléter avec l’identité légale de l’éditeur (raison sociale, SIRET, hébergeur)."
        />
      </Reveal>

      <div className="mt-10 grid gap-4 text-sm text-gray-700 leading-relaxed">
        {[
          {
            h: "Éditeur du site",
            p: "La Solution — informations légales à compléter (forme juridique, capital, adresse du siège, numéro RCS / SIRET).",
          },
          {
            h: "Directeur de la publication",
            p: "À compléter.",
          },
          {
            h: "Hébergement",
            p: "Hébergeur et adresse à compléter selon l’infrastructure de production.",
          },
          {
            h: "Contact",
            p: "Support client via la page /support du site.",
          },
          {
            h: "Propriété intellectuelle",
            p: "L’ensemble des éléments du site (textes, visuels, marque) est protégé. Toute reproduction non autorisée est interdite.",
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
