"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { TextInput } from "@/app/site/components/Form";

export function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const tokenFromUrl = useMemo(() => (searchParams.get("token") || "").trim(), [searchParams]);

  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (tokenFromUrl) setToken(tokenFromUrl);
  }, [tokenFromUrl]);
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    if (password.length < 8) {
      setErrorMessage("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setErrorMessage("Les deux saisies ne correspondent pas.");
      return;
    }
    if (token.length < 32) {
      setErrorMessage("Lien incomplet : ouvrez le lien reçu par email ou collez le jeton fourni.");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/password-reset-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error || "Impossible de mettre à jour le mot de passe.");
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Réseau indisponible.");
    }
  }

  if (status === "success") {
    return (
      <div className="mt-10 rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-sm p-6 md:p-7 grid gap-4">
        <p className="text-sm font-semibold text-gray-900">Mot de passe mis à jour</p>
        <p className="text-sm text-gray-600">Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
        <Link href="/connexion?reset=1" className="btn btn-primary text-center">
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <form className="mt-10 rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-sm p-6 md:p-7 grid gap-4" onSubmit={onSubmit}>
      {!tokenFromUrl ? (
        <TextInput
          label="Jeton (si vous n’avez pas utilisé le lien du mail)"
          placeholder="Collez le jeton reçu"
          value={token}
          onChange={(e) => setToken(e.target.value.trim())}
          autoComplete="off"
        />
      ) : (
        <p className="text-xs text-gray-600">
          Lien de réinitialisation détecté. Saisissez votre nouveau mot de passe ci-dessous.
        </p>
      )}
      <TextInput
        label="Nouveau mot de passe"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
      />
      <TextInput
        label="Confirmer le mot de passe"
        type="password"
        placeholder="••••••••"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        autoComplete="new-password"
      />
      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-2 inline-flex items-center justify-center rounded-xl bg-[var(--logo-red)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--logo-red)]/20 transition-smooth hover:bg-[var(--logo-red-dark)] disabled:opacity-60"
      >
        {status === "loading" ? "Enregistrement…" : "Changer le mot de passe"}
      </button>
      <p className="text-xs text-gray-500">
        <Link href="/mot-de-passe-oublie" className="font-semibold text-gray-800 underline underline-offset-2">
          Demander un nouveau lien
        </Link>
      </p>
    </form>
  );
}
