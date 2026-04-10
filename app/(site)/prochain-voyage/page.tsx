"use client";

import { Reveal } from "@/app/site/components/Reveal";
import { PageHeader } from "@/app/site/components/UI";
import { ProchainVoyageForm } from "./ProchainVoyageForm";

export default function ProchainVoyagePage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-14 md:py-16">
      <Reveal>
        <PageHeader
          eyebrow="SoluPacker"
          title="Déclarez votre prochain voyage"
          subtitle="Indiquez les détails de votre prochain vol pour recevoir des missions à transporter."
        />
      </Reveal>

      <div className="mt-10 grid gap-6 md:grid-cols-[1fr_0.85fr]">
        <Reveal>
          <ProchainVoyageForm />
        </Reveal>

        <Reveal delayMs={120}>
          <div className="rounded-3xl bg-gradient-to-br from-white/85 to-white/55 ring-1 ring-black/5 shadow-xl shadow-gray-200/40 p-6 md:p-7">
            <h2 className="text-sm font-semibold text-gray-900">Pourquoi déclarer ?</h2>
            <ul className="mt-3 grid gap-2 text-sm text-gray-600 leading-relaxed list-disc pl-5">
              <li>Recevoir des missions adaptées à votre trajet.</li>
              <li>Optimiser vos voyages et gagner des commissions.</li>
              <li>Suivre les étapes de remise en toute transparence.</li>
            </ul>
          </div>
        </Reveal>
      </div>
    </main>
  );
}

