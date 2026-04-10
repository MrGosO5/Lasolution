import type { Metadata } from "next";
import { Reveal } from "@/app/site/components/Reveal";
import { PageHeader } from "@/app/site/components/UI";
import { PriseDeContactForm } from "./PriseDeContactForm";

export const metadata: Metadata = {
  title: "Prise de contact",
  description:
    "Envoyez vos coordonnées à La Solution : nous vous recontactons pour vos projets d’achat assisté ou d’expédition.",
};

export default function PriseDeContactPage() {
  return (
    <main className="site-container site-section pt-16 md:pt-20 pb-4">
      <Reveal>
        <PageHeader
          eyebrow="Contact"
          title="Parlons de votre projet"
          subtitle="Laissez-nous vos coordonnées : nom, prénom, e-mail, pays et téléphone. Notre équipe vous recontacte sous peu."
        />
      </Reveal>

      <div className="mt-10 max-w-xl mx-auto w-full">
        <Reveal delayMs={80}>
          <PriseDeContactForm />
        </Reveal>
      </div>
    </main>
  );
}
