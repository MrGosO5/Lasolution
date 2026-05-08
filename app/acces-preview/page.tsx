"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState, Suspense } from "react";

function AccesPreviewForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const callbackUrl = (() => {
    const raw = searchParams.get("callbackUrl") || "/";
    if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
    return "/";
  })();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/site-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; hint?: string };
      if (!res.ok) {
        if (data.error === "server_misconfigured") {
          setError(data.hint || "Configuration serveur incomplète.");
        } else if (res.status === 404) {
          setError("Le portail d’accès n’est pas activé sur ce déploiement.");
        } else {
          setError("Mot de passe incorrect.");
        }
        return;
      }
      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setError("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div
        className="pointer-events-none fixed inset-0 opacity-70 [background:radial-gradient(900px_circle_at_20%_15%,rgba(195,35,83,0.18),transparent_55%),radial-gradient(700px_circle_at_80%_30%,rgba(99,102,241,0.14),transparent_55%)]"
        aria-hidden
      />
      <div className="relative w-full max-w-md rounded-[24px] bg-white/80 backdrop-blur-sm shadow-xl shadow-gray-200/50 ring-1 ring-black/5 p-8 md:p-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">La Solution</p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900 tracking-tight">Accès au site</h1>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Ce site est protégé par un mot de passe local. Saisissez-le pour continuer.
        </p>

        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
          <label className="block">
            <span className="sr-only">Mot de passe</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none ring-0 transition focus:border-[var(--logo-red,#c32353)] focus:ring-2 focus:ring-[var(--logo-red,#c32353)]/20"
              placeholder="Mot de passe"
              required
              disabled={pending}
            />
          </label>
          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-[var(--logo-red,#c32353)] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
          >
            {pending ? "Vérification…" : "Entrer"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function AccesPreviewPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center text-gray-500 text-sm">
          Chargement…
        </main>
      }
    >
      <AccesPreviewForm />
    </Suspense>
  );
}
