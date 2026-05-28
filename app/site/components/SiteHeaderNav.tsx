"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteSignOutButton } from "@/app/site/components/SiteSignOutButton";

type NavItem = { href: string; label: string; match?: "exact" | "prefix" };

const PUBLIC_NAV: NavItem[] = [
  { href: "/services", label: "Services", match: "prefix" },
  { href: "/boutiques", label: "Boutiques", match: "prefix" },
  { href: "/faq", label: "FAQ", match: "exact" },
];

function isNavActive(pathname: string, href: string, match: NavItem["match"] = "prefix"): boolean {
  if (match === "exact") return pathname === href;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function navLinkClass(active: boolean, variant: "inline" | "button") {
  if (variant === "button") {
    return active ? "btn btn-ghost" : "btn btn-ghost";
  }
  return active
    ? "font-semibold text-[var(--logo-red-dark)] underline decoration-[var(--logo-red)] decoration-2 underline-offset-4"
    : "text-gray-700 hover:text-gray-900";
}

function mobileLinkClass(active: boolean) {
  return active
    ? "rounded-xl px-3 py-2 font-semibold text-[var(--logo-red-dark)] bg-[rgba(195,35,83,0.08)] ring-1 ring-[var(--logo-red)]/20"
    : "rounded-xl px-3 py-2 font-semibold text-gray-900 hover:bg-black/5";
}

type Props = {
  isAuthed: boolean;
  isClient: boolean;
  accountHref: string;
  accountLabel: string;
};

export function SiteHeaderNav({ isAuthed, isClient, accountHref, accountLabel }: Props) {
  const pathname = usePathname() || "/";

  const accountMatch: NavItem["match"] = accountHref === "/dashboard" ? "prefix" : "exact";

  const clientNav: NavItem[] = isClient
    ? [
        { href: accountHref, label: accountLabel, match: accountMatch },
        { href: "/mes-commandes", label: "Mes commandes", match: "prefix" },
        { href: "/mes-avis", label: "Mes avis", match: "prefix" },
      ]
    : [{ href: accountHref, label: accountLabel, match: accountMatch }];

  const mobileItems: NavItem[] = [
    ...PUBLIC_NAV,
    ...(isAuthed ? clientNav : []),
  ];

  return (
    <>
      <nav className="hidden items-center gap-6 text-sm md:flex" aria-label="Navigation principale">
        {PUBLIC_NAV.map((item) => {
          const active = isNavActive(pathname, item.href, item.match);
          return (
            <Link key={item.href} href={item.href} className={navLinkClass(active, "inline")} aria-current={active ? "page" : undefined}>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2 md:gap-3">
        {isAuthed ? (
          <>
            {clientNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`hidden md:inline-flex ${navLinkClass(isNavActive(pathname, item.href, item.match), "button")}`}
                aria-current={isNavActive(pathname, item.href, item.match) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
            <SiteSignOutButton className="btn btn-primary" />
          </>
        ) : (
          <>
            <Link
              href="/connexion"
              className={`hidden md:inline-flex ${navLinkClass(pathname === "/connexion" || pathname.startsWith("/login"), "button")}`}
            >
              Se connecter
            </Link>
            <Link href="/inscription" className="btn btn-primary">
              S&apos;inscrire
            </Link>
          </>
        )}

        <details className="relative md:hidden">
          <summary className="list-none cursor-pointer rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-black/5 focus-ring">
            Menu
          </summary>
          <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl bg-white/90 backdrop-blur-md ring-1 ring-black/10 shadow-xl">
            <nav className="grid p-2 text-sm" aria-label="Menu mobile">
              {mobileItems.map((item) => {
                const active = isNavActive(pathname, item.href, item.match);
                return (
                  <Link key={item.href} href={item.href} className={mobileLinkClass(active)} aria-current={active ? "page" : undefined}>
                    {item.label}
                  </Link>
                );
              })}
              <div className="my-1 h-px bg-black/5" />
              {isAuthed ? (
                <SiteSignOutButton className="w-full rounded-xl px-3 py-2 text-left font-semibold text-gray-900 hover:bg-black/5" />
              ) : (
                <>
                  <Link href="/connexion" className={mobileLinkClass(pathname === "/connexion")}>
                    Se connecter
                  </Link>
                  <Link href="/inscription" className={mobileLinkClass(pathname === "/inscription")}>
                    S&apos;inscrire
                  </Link>
                </>
              )}
            </nav>
          </div>
        </details>
      </div>
    </>
  );
}
