import Image from "next/image";
import { Reveal } from "@/app/site/components/Reveal";
import { PageHeader } from "@/app/site/components/UI";
import { Select, TextInput } from "@/app/site/components/Form";

export default function CartePage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-14 md:py-16">
      <Reveal>
        <PageHeader
          eyebrow="Mon espace"
          title="Carte de paiement"
          subtitle="Activez et gérez votre carte pour profiter de vos paiements et rechargements en toute simplicité."
        />
      </Reveal>

      <div className="mt-10 grid gap-6 md:grid-cols-[1fr_0.85fr]">
        <Reveal>
          <div className="rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-sm p-6 md:p-7">
            <h2 className="text-sm font-semibold text-gray-900">Activez votre carte</h2>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              La carte est le moyen le plus simple, rapide et sécurisé pour régler vos commandes sur notre plateforme.
            </p>
            <button
              type="button"
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-[var(--logo-red)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--logo-red)]/20 transition-smooth hover:bg-[var(--logo-red-dark)]"
            >
              Activer ma carte
            </button>

            <div className="mt-6 rounded-2xl bg-white/80 ring-1 ring-black/5 p-5">
              <p className="text-sm font-semibold text-gray-900">Pourquoi activer ma carte ?</p>
              <ul className="mt-3 grid gap-2 text-sm text-gray-600 leading-relaxed list-disc pl-5">
                <li>Transactions sécurisées sur la plateforme.</li>
                <li>Recharger votre solde ou payer directement.</li>
                <li>Remboursements rapides en cas d’annulation.</li>
              </ul>
            </div>
          </div>
        </Reveal>

        <Reveal delayMs={120}>
          <div className="rounded-3xl bg-gradient-to-br from-white/85 to-white/55 ring-1 ring-black/5 shadow-xl shadow-gray-200/40 p-6 md:p-7">
            <p className="text-xs font-semibold tracking-wide text-gray-600 uppercase">Aperçu carte</p>
            <div className="mt-4 relative h-44 w-full">
              <Image src="/icon/dash.png" alt="Carte" fill className="object-contain" />
            </div>
          </div>
        </Reveal>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <Reveal>
          <div className="rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-sm p-6 md:p-7">
            <h2 className="text-sm font-semibold text-gray-900">Recharger ma carte</h2>
            <p className="mt-2 text-sm text-gray-600">
              Rechargez via votre service Mobile Money préféré. Votre solde sera mis à jour automatiquement.
            </p>
            <div className="mt-4 grid gap-4">
              <Select label="Méthode" defaultValue="Mobile Money">
                <option>Mobile Money</option>
                <option>Carte bancaire</option>
              </Select>
              <TextInput label="Numéro de téléphone" placeholder="+33 152629176" />
              <div className="grid gap-4 md:grid-cols-2">
                <Select label="Devise" defaultValue="FCFA">
                  <option>FCFA</option>
                  <option>Euro (€)</option>
                  <option>Dollar ($)</option>
                </Select>
                <TextInput label="Montant" placeholder="20000" inputMode="numeric" />
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/15 transition-smooth hover:bg-black"
              >
                Recharger ma carte
              </button>
            </div>
          </div>
        </Reveal>

        <Reveal delayMs={120}>
          <div className="rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-sm p-6 md:p-7">
            <h2 className="text-sm font-semibold text-gray-900">Retirer de l’argent</h2>
            <p className="mt-2 text-sm text-gray-600">
              Transférez votre solde vers votre compte Mobile Money. Traitement instantané sous réserve de validation.
            </p>
            <div className="mt-4 grid gap-4">
              <TextInput label="Numéro de téléphone" placeholder="+33 152629176" />
              <div className="grid gap-4 md:grid-cols-2">
                <TextInput label="Montant" placeholder="20000" inputMode="numeric" />
                <Select label="Devise" defaultValue="FCFA">
                  <option>FCFA</option>
                  <option>Euro (€)</option>
                  <option>Dollar ($)</option>
                </Select>
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/15 transition-smooth hover:bg-black"
              >
                Valider le retrait
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </main>
  );
}

