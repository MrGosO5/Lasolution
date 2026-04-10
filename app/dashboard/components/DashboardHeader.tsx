import { SignOutButton } from "@/app/components/SignOutButton";
import type { Session } from "next-auth";

export function DashboardHeader({
  title,
  session,
  rightSlot,
  subtitle,
}: {
  title: string;
  session: Session | null;
  rightSlot?: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <header className="flex flex-row justify-between items-center px-6 py-3 bg-white min-h-[56px] flex-shrink-0 border-b border-figma-tableBorder shadow-header">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="flex flex-col gap-0.5">
          <h1 className="font-bold text-xl leading-tight text-figma-headerTitle truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-figma-adminSub truncate" role="doc-subtitle">
              {subtitle}
            </p>
          )}
        </div>
        {rightSlot}
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <button
          type="button"
          className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-figma-tableHeader hover:bg-figma-tableRowBorder transition-smooth duration-fast focus-ring"
          aria-label="Voir les notifications"
        >
          <BellIcon />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D6364E] ring-2 ring-white" />
        </button>
        <div className="flex items-center gap-3 pl-2 border-l border-figma-tableBorder">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-figma-activeMenuText to-figma-activeMenuText/80 flex items-center justify-center text-sm font-bold text-white ring-2 ring-figma-tableRowBorder">
            {session?.user?.name?.[0] ?? session?.user?.email?.[0] ?? "A"}
          </div>
          <div className="flex flex-col hidden sm:block">
            <span className="font-semibold text-sm leading-tight text-figma-headerTitle">
              {session?.user?.name ?? "Admin"}
            </span>
            <span className="text-xs text-figma-adminSub">Compte administrateur</span>
          </div>
        </div>
        <SignOutButton />
      </div>
    </header>
  );
}

function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="shrink-0 text-figma-label" aria-hidden>
      <path
        d="M18 8a6 6 0 0 0-12 0c0 3.09-.78 5.42-1.65 6.69-.35.52-.53 1.1-.53 1.69v.62c0 .55.45 1 1 1h14.36c.55 0 1-.45 1-1v-.62c0-.59-.18-1.17-.53-1.69C18.78 13.42 18 11.09 18 8z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
