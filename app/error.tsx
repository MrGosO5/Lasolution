"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gray-50">
      <div className="text-center max-w-md">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Une erreur est survenue</h1>
        <p className="text-gray-600 text-sm mb-6">
          {error.message || "Erreur inattendue."}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="rounded-xl px-4 py-2 text-sm font-medium bg-[var(--logo-red)] text-white hover:bg-[var(--logo-red-dark)]"
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="rounded-xl px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
