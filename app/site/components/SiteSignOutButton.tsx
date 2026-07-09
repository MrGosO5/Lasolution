"use client";

import { signOut } from "next-auth/react";

type SiteSignOutButtonProps = {
  className?: string;
  children?: React.ReactNode;
  callbackUrl?: string;
};

function LogOutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function resolvePostSignOutUrl(callbackUrl: string) {
  if (callbackUrl.startsWith("http://") || callbackUrl.startsWith("https://")) {
    return callbackUrl;
  }
  return callbackUrl.startsWith("/") ? callbackUrl : `/${callbackUrl}`;
}

export function SiteSignOutButton({
  className = "btn btn-primary",
  children = "Se déconnecter",
  callbackUrl = "/connexion",
}: SiteSignOutButtonProps) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        void (async () => {
          try {
            await fetch("/api/auth/logout-backend", { method: "POST" });
          } catch {
            /* best effort */
          }
          await signOut({ redirect: false });
          window.location.assign(resolvePostSignOutUrl(callbackUrl));
        })();
      }}
    >
      <span className="inline-flex items-center gap-2">
        <LogOutIcon />
        <span>{children}</span>
      </span>
    </button>
  );
}
