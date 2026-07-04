"use client";

import Image from "next/image";
import Link from "next/link";
import { signIn, getSession, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/app/site/components/Reveal";
import { PasswordInput, TextInput } from "@/app/site/components/Form";
import { PageHeader } from "@/app/site/components/UI";
import {
  applyRoleToDefaultHub,
  sanitizeSiteLoginCallback,
} from "@/lib/site-login-redirect";
import type { AppRole } from "@/types/app-role";

export default function ConnexionSitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const justRegistered = searchParams.get("registered") === "1";
  const justReset = searchParams.get("reset") === "1";
  const sessionExpired = searchParams.get("session") === "expired";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const didRedirectAuthed = useRef(false);

  const callbackRaw = searchParams.get("callbackUrl");
  const userId = session?.user?.id;
  const userRole = session?.user?.role as AppRole | undefined;

  useEffect(() => {
    if (status !== "authenticated" || !userId || didRedirectAuthed.current) return;
    didRedirectAuthed.current = true;
    const origin = window.location.origin;
    const dest = applyRoleToDefaultHub(
      sanitizeSiteLoginCallback(callbackRaw, origin),
      userRole
    );
    window.location.replace(dest);
  }, [status, userId, userRole, callbackRaw]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (res?.error || !res?.ok) {
        setError("Connexion refusée. Vérifiez votre email et mot de passe.");
        setLoading(false);
        return;
      }

      router.refresh();
      await new Promise<void>((r) => {
        queueMicrotask(r);
      });
      const sessionAfter = await getSession();
      const role = sessionAfter?.user?.role as AppRole | undefined;

      const origin = window.location.origin;
      const raw = searchParams.get("callbackUrl");
      const destination = applyRoleToDefaultHub(
        sanitizeSiteLoginCallback(raw, origin),
        role
      );

      window.location.href = destination;
    } catch {
      setError("Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="site-container site-section">
      <div className="grid gap-10 md:grid-cols-[1fr_0.9fr] items-start">
        <Reveal>
          <div className="rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-sm p-6 md:p-7">
            <PageHeader
              eyebrow="Compte"
              title="Se connecter"
              subtitle="Accédez à vos services de livraison, suivi de colis et commandes."
            />

            <form className="mt-8 grid gap-4" onSubmit={onSubmit}>
              {justRegistered ? (
                <p className="text-sm text-emerald-900 rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
                  Compte créé. Connectez-vous avec votre email et votre mot de passe.
                </p>
              ) : null}
              {justReset ? (
                <p className="text-sm text-emerald-900 rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
                  Mot de passe réinitialisé. Connectez-vous avec votre nouvelle combinaison.
                </p>
              ) : null}
              {sessionExpired ? (
                <p className="text-sm text-amber-950 rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
                  Votre session a expiré. Reconnectez-vous pour continuer.
                </p>
              ) : null}
              {error ? <p className="text-sm text-red-700 rounded-xl bg-red-50 px-4 py-3 ring-1 ring-red-200">{error}</p> : null}

              <TextInput
                label="Email"
                type="email"
                placeholder="emilejames@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <PasswordInput
                label="Mot de passe"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />

              <div className="flex items-center justify-between gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" className="h-4 w-4" defaultChecked />
                  Rester connecté(e)
                </label>
                <Link className="text-sm font-semibold text-gray-900 hover:underline" href="/mot-de-passe-oublie">
                  Mot de passe oublié ?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 btn btn-primary disabled:opacity-70 disabled:pointer-events-none"
              >
                {loading ? "Connexion..." : "Se connecter"}
              </button>

              <p className="text-sm text-gray-600">
                Vous n’avez pas de compte ?{" "}
                <Link className="font-semibold text-gray-900 hover:underline" href="/inscription">
                  Inscrivez-vous
                </Link>
              </p>
            </form>
          </div>
        </Reveal>

        <Reveal delayMs={120}>
          <div className="relative overflow-hidden rounded-3xl ring-1 ring-black/5 shadow-xl shadow-gray-200/40 bg-white/70 p-7">
            <p className="text-xs font-semibold tracking-wide text-gray-600 uppercase">Aide</p>
            <p className="mt-2 text-sm text-gray-700">
              Utilisez vos identifiants. Si vous n’avez pas de compte, créez-en un via{" "}
              <Link className="font-semibold hover:underline" href="/inscription">
                l’inscription
              </Link>
              .
            </p>
            <div className="mt-6 relative h-44 w-full">
              <Image
                src="/icon/auth-illustration.svg"
                alt="Illustration"
                fill
                sizes="(max-width: 768px) 100vw, 480px"
                className="object-contain"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </main>
  );
}

