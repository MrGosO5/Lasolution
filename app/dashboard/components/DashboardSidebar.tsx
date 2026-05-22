"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function DashboardSidebar() {
  const pathname = usePathname();

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");

  const linkClass = (active: boolean) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm leading-[19px] transition-smooth duration-fast ${
      active
        ? "bg-figma-activeMenu text-figma-activeMenuText font-semibold shadow-card border-l-4 border-l-figma-activeMenuText"
        : "text-figma-headerTitle font-medium hover:bg-figma-tableRowHover border-l-4 border-l-transparent"
    }`;

  return (
    <aside className="hidden md:flex w-[260px] flex-shrink-0 flex-col bg-figma-sidebar border-r border-figma-sidebarBorder shadow-sidebar pt-6 px-4 gap-6">
      <Link
        href="/dashboard"
        className="relative block h-[60px] w-[170px] focus-ring rounded-lg outline-none"
        aria-label="Accueil La Solution"
      >
        <Image
          src="/icon/logolasolution.png"
          alt="La Solution"
          fill
          sizes="170px"
          className="object-contain object-left"
        />
      </Link>
      <nav className="flex flex-col gap-1 w-full" aria-label="Menu principal">
        <Link
          href="/dashboard"
          className={linkClass(
            isActive("/dashboard") &&
              !pathname.includes("/utilisateurs") &&
              !pathname.includes("/commandes") &&
              !pathname.includes("/parametres") &&
              !pathname.includes("/demandes")
          )}
        >
          <DashboardIcon
            className={
              isActive("/dashboard") &&
              !pathname.includes("/utilisateurs") &&
              !pathname.includes("/commandes") &&
              !pathname.includes("/parametres") &&
              !pathname.includes("/demandes")
                ? "text-figma-activeMenuText"
                : "text-figma-label"
            }
          />
          <span>Tableau de bord</span>
        </Link>
        <Link
          href="/dashboard/utilisateurs"
          className={linkClass(pathname.includes("/utilisateurs"))}
        >
          <UserIcon
            className={
              pathname.includes("/utilisateurs")
                ? "text-figma-activeMenuText"
                : "text-figma-label"
            }
          />
          <span>Utilisateurs</span>
        </Link>
        <Link
          href="/dashboard/commandes"
          className={linkClass(pathname.includes("/commandes"))}
        >
          <PackageIcon
            className={
              pathname.includes("/commandes")
                ? "text-figma-activeMenuText"
                : "text-figma-label"
            }
          />
          <span>Commandes</span>
        </Link>
        <Link
          href="/dashboard/demandes"
          className={linkClass(pathname.includes("/demandes"))}
        >
          <InboxIcon
            className={
              pathname.includes("/demandes")
                ? "text-figma-activeMenuText"
                : "text-figma-label"
            }
          />
          <span>Demandes</span>
        </Link>
        <Link
          href="/dashboard/parametres"
          className={linkClass(pathname.includes("/parametres"))}
        >
          <SettingsIcon
            className={
              pathname.includes("/parametres")
                ? "text-figma-activeMenuText"
                : "text-figma-label"
            }
          />
          <span>Paramètres</span>
        </Link>
      </nav>
    </aside>
  );
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      className={`shrink-0 ${className ?? "text-figma-label"}`}
      aria-hidden
    >
      <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      className={`shrink-0 ${className ?? "text-figma-label"}`}
      aria-hidden
    >
      <circle cx="12" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 20c0-4 3-7 7-7s7 3 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PackageIcon({ className }: { className?: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      className={`shrink-0 ${className ?? "text-figma-label"}`}
      aria-hidden
    >
      <path d="M4 8l8-4 8 4v8l-8 4-8-4V8z" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4 8l8 4 8-4M12 12v8" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function InboxIcon({ className }: { className?: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      className={`shrink-0 ${className ?? "text-figma-label"}`}
      aria-hidden
    >
      <path d="M2 12l3-7h14l3 7v5a2 2 0 01-2 2H4a2 2 0 01-2-2v-5z" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 12h5l1.5 3h7L17 12h5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      className={`shrink-0 ${className ?? "text-figma-label"}`}
      aria-hidden
    >
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
