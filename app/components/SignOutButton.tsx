"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => {
        void (async () => {
          try {
            await fetch("/api/auth/logout-backend", { method: "POST" });
          } catch {
            /* best effort */
          }
          await signOut({ redirect: false });
          window.location.assign("/connexion");
        })();
      }}
      className="text-sm font-medium text-[var(--logo-red)] hover:text-[var(--logo-red-dark)] transition-colors"
    >
      Déconnexion
    </button>
  );
}
