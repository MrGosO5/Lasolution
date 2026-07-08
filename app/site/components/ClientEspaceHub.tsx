import Link from "next/link";
import type { Session } from "next-auth";
import { Reveal } from "@/app/site/components/Reveal";

type Tab = {
  href: string;
  title: string;
  desc: string;
};

const tabs: Tab[] = [
  { href: "/mes-commandes", title: "Commandes", desc: "Historique, statut, détails et preuve photo." },
  { href: "/mes-expeditions", title: "Mes expéditions", desc: "Suivez vos demandes d’expédition aérien et maritime." },
  { href: "/mes-avis", title: "Mes avis", desc: "Témoignages laissés après livraison de vos commandes." },
  { href: "/mon-profil", title: "Profil", desc: "Informations personnelles et contacts." },
  { href: "/parametres", title: "Paramètres", desc: "Sécurité, langue, préférences." },
  { href: "/notifications", title: "Notifications", desc: "Événements sur vos commandes et paiements." },
  { href: "/carte", title: "Carte", desc: "Activer, recharger, retirer et historique." },
];

export function ClientEspaceHub({ session }: { session: Session }) {
  return (
    <>
      <Reveal delayMs={120}>
        <div className="mt-10 card p-6 md:p-7">
          <p className="text-sm font-semibold text-gray-900">Bienvenue</p>
          <p className="mt-1 text-sm text-gray-600">{session.user?.name ?? session.user?.email}</p>
        </div>
      </Reveal>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {tabs.map((t, idx) => (
          <Reveal key={t.href} delayMs={80 + idx * 70} className="h-full">
            <Link href={t.href} className="card h-full p-6 focus-ring">
              <p className="text-sm font-semibold text-gray-900">{t.title}</p>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{t.desc}</p>
              <p className="card-cta">
                Ouvrir
                <span className="card-cta__arrow" aria-hidden="true">→</span>
              </p>
            </Link>
          </Reveal>
        ))}
        <Reveal delayMs={80 + tabs.length * 70} className="h-full">
          <Link href="/boutiques" className="card h-full p-6 focus-ring">
            <p className="text-sm font-semibold text-gray-900">Boutiques</p>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              Amazon, AliExpress, TEMU, SHEIN… Parcourez les catalogues et ajoutez au panier.
            </p>
            <p className="card-cta">
            Voir les boutiques
            <span className="card-cta__arrow" aria-hidden="true">→</span>
          </p>
          </Link>
        </Reveal>
        <Reveal delayMs={80 + (tabs.length + 1) * 70} className="h-full">
          <Link href="/panier" className="card h-full p-6 focus-ring">
            <p className="text-sm font-semibold text-gray-900">Panier</p>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              Consultez vos articles, ajustez les quantités et passez au paiement.
            </p>
            <p className="card-cta">
            Voir le panier
            <span className="card-cta__arrow" aria-hidden="true">→</span>
          </p>
          </Link>
        </Reveal>
      </div>
    </>
  );
}
