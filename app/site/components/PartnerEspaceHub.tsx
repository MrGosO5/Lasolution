import Link from "next/link";
import type { AppRole } from "@/types/app-role";
import { partnerPathByRole } from "@/lib/partner-routes";
import { Reveal } from "@/app/site/components/Reveal";

const extrasByRole: Partial<
  Record<AppRole, { href: string; title: string; desc: string }[]>
> = {
  relais: [
    {
      href: "/devenir-point-relai",
      title: "Programme point relais",
      desc: "Informations sur le partenariat et les avantages.",
    },
  ],
  solu_livreur: [],
  ambassadeur: [],
};

export function PartnerEspaceHub({ role }: { role: Exclude<AppRole, "admin" | "client" | "solupacker"> }) {
  const base = partnerPathByRole[role];
  const extras = extrasByRole[role] ?? [];

  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      {base ? (
        <Reveal className="h-full md:col-span-2">
          <Link href={base} className="card h-full p-6 focus-ring">
            <p className="text-sm font-semibold text-gray-900">Espace partenaire</p>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              Accédez à votre tableau et outils dédiés à votre rôle.
            </p>
            <p className="mt-4 text-sm font-semibold text-gray-900">Ouvrir l’espace →</p>
          </Link>
        </Reveal>
      ) : null}
      {extras.map((c, idx) => (
        <Reveal key={c.href} delayMs={100 + idx * 70} className="h-full">
          <Link href={c.href} className="card h-full p-6 focus-ring">
            <p className="text-sm font-semibold text-gray-900">{c.title}</p>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">{c.desc}</p>
            <p className="mt-4 text-sm font-semibold text-gray-900">Voir →</p>
          </Link>
        </Reveal>
      ))}
      <Reveal delayMs={180} className="h-full">
        <Link href="/notifications" className="card h-full p-6 focus-ring">
          <p className="text-sm font-semibold text-gray-900">Notifications</p>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">Messages et alertes liés à votre activité.</p>
          <p className="mt-4 text-sm font-semibold text-gray-900">Ouvrir →</p>
        </Link>
      </Reveal>
      <Reveal delayMs={250} className="h-full">
        <Link href="/parametres" className="card h-full p-6 focus-ring">
          <p className="text-sm font-semibold text-gray-900">Paramètres</p>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">Sécurité du compte et préférences.</p>
          <p className="mt-4 text-sm font-semibold text-gray-900">Ouvrir →</p>
        </Link>
      </Reveal>
    </div>
  );
}
