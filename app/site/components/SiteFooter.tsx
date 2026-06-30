import Link from "next/link";
import { Logo } from "@/app/components/Logo";

type FooterLink = { href: string; label: string };

const NAVIGATION: FooterLink[] = [
  { href: "/", label: "Accueil" },
  { href: "/services", label: "Services" },
  { href: "/faq", label: "FAQ" },
];

const LEGAL: FooterLink[] = [
  { href: "/politique-de-confidentialite", label: "Politique de confidentialité" },
  { href: "/conditions-generales", label: "CGU / CGV" },
  { href: "/mentions-legales", label: "Mentions légales" },
];

const AIDE: FooterLink[] = [{ href: "/support", label: "Support client" }];

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <nav aria-label={title} className="flex flex-col gap-2 text-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-900">{title}</p>
      <ul className="flex flex-col gap-1.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-gray-600 transition-colors hover:text-gray-900"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-black/5 bg-white/60 backdrop-blur-sm">
      <div className="site-container py-10">
        <Link href="/" className="inline-flex focus-ring rounded-lg">
          <Logo />
        </Link>

        <div className="mt-8 grid grid-cols-2 items-start gap-x-6 gap-y-8 sm:grid-cols-3 lg:gap-x-8">
          <FooterColumn title="Navigation" links={NAVIGATION} />
          <FooterColumn title="Légal" links={LEGAL} />
          <FooterColumn title="Aide" links={AIDE} />
        </div>

        <p className="mt-8 border-t border-black/5 pt-6 text-center text-xs text-gray-500 sm:text-left">
          © 2025 La Solution — Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
