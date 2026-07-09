"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteSignOutButton } from "@/app/site/components/SiteSignOutButton";

type NavItem = { href: string; label: string; match?: "exact" | "prefix" };

function buildMainNav(isClient: boolean): NavItem[] {
  return [
    { href: isClient ? "/mon-espace" : "/", label: "Accueil", match: "exact" },
    { href: "/services", label: "Services", match: "prefix" },
    { href: "/faq", label: "FAQ", match: "exact" },
  ];
}

function isNavActive(pathname: string, href: string, match: NavItem["match"] = "prefix"): boolean {
  if (match === "exact") return pathname === href;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function navLinkClass(active: boolean) {
  return [
    "relative whitespace-nowrap text-sm font-medium transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:rounded-full after:bg-[var(--logo-red)] after:transition-all",
    active
      ? "text-gray-900 after:w-full"
      : "text-gray-600 hover:text-gray-900 after:w-0 hover:after:w-full",
  ].join(" ");
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

  const mainNav = buildMainNav(isClient);

  const accountNav: NavItem[] =
    isAuthed && !isClient
      ? [{ href: accountHref, label: accountLabel, match: accountMatch }]
      : [];

  const mobileItems: NavItem[] = isAuthed && !isClient ? [...mainNav, ...accountNav] : mainNav;

  return (
    <>
      <nav
        className="hidden items-center justify-center gap-7 lg:col-start-2 lg:row-start-1 lg:flex"
        aria-label="Navigation principale"
      >
        <ul className="flex items-center gap-7">
          {mainNav.map((item) => {
            const active = isNavActive(pathname, item.href, item.match);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={navLinkClass(active)}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="col-start-2 row-start-1 flex items-center justify-end gap-2 justify-self-end lg:col-start-3 lg:gap-5">
        {isAuthed ? (
          <>
            {accountNav.length > 0 ? (
              <nav className="hidden items-center gap-5 lg:flex" aria-label="Mon compte">
                {accountNav.map((item) => {
                  const active = isNavActive(pathname, item.href, item.match);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={navLinkClass(active)}
                      aria-current={active ? "page" : undefined}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            ) : null}
            <SiteSignOutButton className="btn btn-primary hidden lg:inline-flex" />
          </>
        ) : (
          <>
            <Link
              href="/connexion"
              className={`hidden lg:inline-flex ${navLinkClass(pathname === "/connexion" || pathname.startsWith("/login"))}`}
            >
              Se connecter
            </Link>
            <Link href="/inscription" className="btn btn-primary">
              S&apos;inscrire
            </Link>
          </>
        )}

        <details className="relative lg:hidden">
          <summary className="flex h-10 w-10 list-none cursor-pointer items-center justify-center rounded-xl text-gray-900 hover:bg-black/5 focus-ring [&::-webkit-details-marker]:hidden">
            <span className="sr-only">Ouvrir le menu</span>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </summary>
          <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl bg-white/95 backdrop-blur-md ring-1 ring-black/10 shadow-xl">
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
