"use client";

import Image from "next/image";
import { Reveal } from "@/app/site/components/Reveal";
import { PageHeader } from "@/app/site/components/UI";
import { InscriptionForm } from "./InscriptionForm";

export default function InscriptionPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-14 md:py-16">
      <div className="grid gap-10 md:grid-cols-[1fr_0.9fr] items-start">
        <Reveal>
          <div className="rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-sm p-6 md:p-7">
            <PageHeader
              eyebrow="Compte"
              title="Création de compte"
              subtitle="Rejoignez la communauté et profitez de services de livraison et d’achat entre l’Europe et l’Afrique."
            />
            <InscriptionForm />
          </div>
        </Reveal>

        <Reveal delayMs={120}>
          <div className="relative overflow-hidden rounded-3xl ring-1 ring-black/5 shadow-xl shadow-gray-200/40 bg-white/70 p-7">
            <p className="text-xs font-semibold tracking-wide text-gray-600 uppercase">Aperçu</p>
            <p className="mt-2 text-sm text-gray-700">
              Un espace pour suivre vos commandes, payer, et gérer votre profil.
            </p>
            <div className="mt-6 relative h-44 w-full">
              <Image
                src="/icon/auth-illustration.svg"
                alt="Illustration"
                fill
                sizes="(max-width: 768px) 100vw, 480px"
                className="object-contain"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </main>
  );
}

