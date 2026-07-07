"use client";

import { signOut } from "next-auth/react";

type SiteSignOutButtonProps = {
  className?: string;
  children?: React.ReactNode;
  callbackUrl?: string;
};

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
      {children}
    </button>
  );
}
