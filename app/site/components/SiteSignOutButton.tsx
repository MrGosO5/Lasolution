"use client";

import { signOut } from "next-auth/react";

type SiteSignOutButtonProps = {
  className?: string;
  children?: React.ReactNode;
  /** Après déconnexion (défaut : page de connexion vitrine). */
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
          // redirect: false évite une redirection basée sur NEXTAUTH_URL (souvent le port API en dev).
          await signOut({ redirect: false });
          window.location.assign(resolvePostSignOutUrl(callbackUrl));
        })();
      }}
    >
      {children}
    </button>
  );
}
