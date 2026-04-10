"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="text-sm font-medium text-[var(--logo-red)] hover:text-[var(--logo-red-dark)] transition-colors"
    >
      Déconnexion
    </button>
  );
}
