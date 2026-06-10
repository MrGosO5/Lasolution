import Link from "next/link";
import { Reveal } from "@/app/site/components/Reveal";

type Card = { href: string; title: string; desc: string };

const cards: Card[] = [
  {
    href: "/prochain-voyage",
    title: "Déclarer un voyage",
    desc: "Indiquez votre prochain trajet pour recevoir des missions adaptées.",
  },
  {
    href: "/missions",
    title: "Mes missions",
    desc: "Suivez l’état, les commissions et le détail de chaque mission.",
  },
  {
    href: "/expedier-un-colis",
    title: "Expédier un colis",
    desc: "Créez une demande d’expédition pour vos envois.",
  },
  {
    href: "/partenaire/packer",
    title: "Espace partenaire",
    desc: "Vue dédiée SoluPacker (outils et suivi côté partenaire).",
  },
  {
    href: "/notifications",
    title: "Notifications",
    desc: "Alertes missions, validations et messages.",
  },
  {
    href: "/parametres",
    title: "Paramètres",
    desc: "Sécurité du compte et préférences.",
  },
];

export function SoluPackerEspaceHub() {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-3">
      {cards.map((c, idx) => (
        <Reveal key={c.href} delayMs={80 + idx * 70} className="h-full">
          <Link href={c.href} className="card h-full p-6 focus-ring">
            <p className="text-sm font-semibold text-gray-900">{c.title}</p>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">{c.desc}</p>
            <p className="mt-4 text-sm font-semibold text-gray-900">Ouvrir →</p>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}
