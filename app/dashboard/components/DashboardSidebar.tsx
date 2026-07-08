"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BRAND_LOGO_SRC } from "@/lib/brand-logo";

function SidebarNav({
  pathname,
  pendingTestimonials,
  onNavigate,
}: {
  pathname: string;
  pendingTestimonials: number;
  onNavigate?: () => void;
}) {
  const pendingBadge =
    pendingTestimonials > 0
      ? pendingTestimonials > 99
        ? "99+"
        : String(pendingTestimonials)
      : null;

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");

  const isHome =
    isActive("/dashboard") &&
    !pathname.includes("/expeditions") &&
    !pathname.includes("/utilisateurs") &&
    !pathname.includes("/commandes") &&
    !pathname.includes("/parametres") &&
    !pathname.includes("/demandes") &&
    !pathname.includes("/avis");

  const linkClass = (active: boolean) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm leading-[19px] transition-smooth duration-fast ${
      active
        ? "bg-figma-activeMenu text-figma-activeMenuText font-semibold shadow-card border-l-4 border-l-figma-activeMenuText"
        : "text-figma-headerTitle font-medium hover:bg-figma-tableRowHover border-l-4 border-l-transparent"
    }`;

  return (
    <nav className="flex flex-col gap-1 w-full" aria-label="Menu principal">
      <Link href="/dashboard" className={linkClass(isHome)} onClick={onNavigate}>
        <DashboardIcon className={isHome ? "text-figma-activeMenuText" : "text-figma-label"} />
        <span>Tableau de bord</span>
      </Link>
      <Link
        href="/dashboard/utilisateurs"
        className={linkClass(pathname.includes("/utilisateurs"))}
        onClick={onNavigate}
      >
        <UserIcon
          className={pathname.includes("/utilisateurs") ? "text-figma-activeMenuText" : "text-figma-label"}
        />
        <span>Utilisateurs</span>
      </Link>
      <Link
        href="/dashboard/commandes"
        className={linkClass(pathname.includes("/commandes"))}
        onClick={onNavigate}
      >
        <PackageIcon
          className={pathname.includes("/commandes") ? "text-figma-activeMenuText" : "text-figma-label"}
        />
        <span>Commandes</span>
      </Link>
      <Link
        href="/dashboard/expeditions"
        className={linkClass(pathname.includes("/expeditions"))}
        onClick={onNavigate}
      >
        <PackageIcon
          className={pathname.includes("/expeditions") ? "text-figma-activeMenuText" : "text-figma-label"}
        />
        <span>Expéditions</span>
      </Link>
      <Link
        href="/dashboard/demandes"
        className={linkClass(pathname.includes("/demandes"))}
        onClick={onNavigate}
      >
        <InboxIcon
          className={pathname.includes("/demandes") ? "text-figma-activeMenuText" : "text-figma-label"}
        />
        <span>Demandes</span>
      </Link>
      <Link
        href="/dashboard/avis?status=PENDING"
        className={`${linkClass(pathname.includes("/avis"))} relative`}
        onClick={onNavigate}
      >
        <StarIcon
          className={pathname.includes("/avis") ? "text-figma-activeMenuText" : "text-figma-label"}
        />
        <span className="flex-1">Avis</span>
        {pendingBadge ? (
          <span
            className="ml-auto min-w-[1.35rem] h-5 px-1.5 rounded-full bg-amber-500 text-white text-[11px] font-bold leading-none flex items-center justify-center"
            title={`${pendingTestimonials} avis en attente`}
            aria-label={`${pendingTestimonials} avis en attente de validation`}
          >
            {pendingBadge}
          </span>
        ) : null}
      </Link>
      <Link
        href="/dashboard/parametres"
        className={linkClass(pathname.includes("/parametres"))}
        onClick={onNavigate}
      >
        <SettingsIcon
          className={pathname.includes("/parametres") ? "text-figma-activeMenuText" : "text-figma-label"}
        />
        <span>Paramètres</span>
      </Link>
    </nav>
  );
}

export function DashboardSidebar({ pendingTestimonials = 0 }: { pendingTestimonials?: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const hasPending = pendingTestimonials > 0;

  return (
    <>
      {/* Barre mobile (hamburger) */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-figma-sidebar border-b border-figma-sidebarBorder px-4 py-3 shadow-header">
        <Link
          href="/dashboard"
          className="relative block h-8 aspect-[1550/364] focus-ring rounded-lg outline-none"
          aria-label="Accueil La Solution"
        >
          <Image src={BRAND_LOGO_SRC} alt="La Solution" fill sizes="180px" className="object-contain object-left" priority />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-figma-sidebarBorder bg-white text-figma-headerTitle hover:bg-figma-tableRowHover focus-ring"
          aria-label="Ouvrir le menu"
          aria-haspopup="menu"
        >
          <MenuIcon />
          {hasPending ? (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" />
          ) : null}
        </button>
      </div>

      {/* Drawer mobile */}
      {open ? (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-[280px] max-w-[85vw] flex-col gap-6 overflow-y-auto bg-figma-sidebar px-4 pt-5 pb-8 shadow-sidebar">
            <div className="flex items-center justify-between">
              <span className="relative block h-8 aspect-[1550/364]">
                <Image src={BRAND_LOGO_SRC} alt="La Solution" fill sizes="180px" className="object-contain object-left" />
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-figma-sidebarBorder bg-white text-figma-label hover:bg-figma-tableRowHover focus-ring"
                aria-label="Fermer le menu"
              >
                <CloseIcon />
              </button>
            </div>
            <SidebarNav
              pathname={pathname}
              pendingTestimonials={pendingTestimonials}
              onNavigate={() => setOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-[260px] flex-shrink-0 flex-col bg-figma-sidebar border-r border-figma-sidebarBorder shadow-sidebar pt-6 px-4 gap-6">
        <Link
          href="/dashboard"
          className="relative block h-12 aspect-[1550/364] focus-ring rounded-lg outline-none"
          aria-label="Accueil La Solution"
        >
          <Image src={BRAND_LOGO_SRC} alt="La Solution" fill sizes="220px" className="object-contain object-left" priority />
        </Link>
        <SidebarNav pathname={pathname} pendingTestimonials={pendingTestimonials} />
      </aside>
    </>
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

function StarIcon({ className }: { className?: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      className={`shrink-0 ${className ?? "text-figma-label"}`}
      aria-hidden
    >
      <path
        d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
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

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden>
      <path d="M7 7l10 10M17 7L7 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
