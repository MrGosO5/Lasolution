"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { Suspense, useState } from "react";
import { LogoWithTagline } from "../components/LogoWithTagline";
import { partnerPathByRole } from "@/lib/partner-routes";
import type { AppRole } from "@/types/app-role";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-gradient-to-br from-gray-50 to-white">
          <p className="text-sm text-gray-500">Chargement…</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (res?.error) {
        const apiBase =
          typeof window !== "undefined"
            ? process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:4000"
            : "";
        let detail =
          "Vérifiez votre e-mail et votre mot de passe, ou que votre compte partenaire est bien configuré côté serveur.";
        try {
          const h = await fetch(`${apiBase}/health`);
          if (!h.ok) {
            detail = "L’API backend répond mal. Vérifiez qu’elle tourne (port 4000, commande npm run backend:dev).";
          }
        } catch {
          detail =
            "Impossible de joindre l’API (http://localhost:4000). Démarrez le backend depuis la racine : npm run backend:dev.";
        }
        setError(`Connexion refusée. ${detail}`);
        setLoading(false);
        return;
      }
      if (res?.ok) {
        const session = await getSession();
        const role = session?.user?.role as AppRole | undefined;
        let path = callbackUrl;
        if (role === "admin") path = "/dashboard";
        else if (role === "client") path = "/mon-espace";
        else if (role && partnerPathByRole[role]) path = partnerPathByRole[role]!;
        // Redirection en URL complète pour garder le bon port (ex: 3001)
        const url = typeof window !== "undefined" ? window.location.origin + path : path;
        window.location.href = url;
        return;
      }
    } catch {
      setError("Une erreur est survenue.");
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-gradient-to-br from-gray-50 to-white">
      <div className="w-full max-w-md flex flex-col gap-3 animate-fade-in">
        <LogoWithTagline />

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Se connecter
          </h1>
          <p className="text-sm text-gray-500">
            Connectez-vous et gérez votre plateforme
          </p>
        </div>

        <form
          className="flex flex-col gap-6 rounded-2xl bg-white/80 backdrop-blur-sm p-8 shadow-xl shadow-gray-200/50 border border-gray-100"
          onSubmit={handleSubmit}
        >
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">
              {error}
            </p>
          )}
          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
            Email
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200">
                <EnvelopeIcon />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-11 pr-4 text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:border-[var(--logo-red)] focus:outline-none focus:ring-2 focus:ring-[var(--logo-red)]/20 focus:ring-offset-0"
                placeholder="votre@email.com"
                required
                autoComplete="email"
              />
            </div>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
            Mot de passe
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200">
                <LockIcon />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-11 pr-12 text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:border-[var(--logo-red)] focus:outline-none focus:ring-2 focus:ring-[var(--logo-red)]/20 focus:ring-offset-0"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 rounded-lg transition-colors duration-200 hover:text-gray-600 hover:bg-gray-100"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full rounded-xl py-3.5 text-base font-semibold text-white shadow-lg shadow-[var(--logo-red)]/25 transition-all duration-200 bg-[var(--logo-red)] hover:bg-[var(--logo-red-dark)] hover:shadow-xl hover:shadow-[var(--logo-red)]/30 active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>

          <Link
            href="/mot-de-passe-oublie"
            className="text-center text-sm font-medium text-[var(--logo-red)] transition-colors duration-200 hover:text-[var(--logo-red-dark)]"
          >
            Mot de passe oublié ?
          </Link>

        </form>
      </div>
    </main>
  );
}

function EnvelopeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
