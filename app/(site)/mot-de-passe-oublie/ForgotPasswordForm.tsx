"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { TextInput } from "@/app/site/components/Form";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/password-reset-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error || "Demande impossible.");
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
      <div className="mt-10 rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-sm p-6 md:p-7">
        <p className="text-sm font-semibold text-gray-900">Demande prise en compte</p>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Si cette adresse correspond à un compte avec mot de passe, un email contenant un lien sécurisé (valable 1 heure)
          vient d’être envoyé. Vérifiez aussi vos courriers indésirables. L’équipe support est également informée.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link href="/mot-de-passe-oublie/nouveau" className="btn btn-primary text-center">
            J’ai cliqué sur le lien du mail
          </Link>
          <Link href="/connexion" className="btn btn-ghost text-center">
            Retour connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="mt-10 rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-sm p-6 md:p-7" onSubmit={onSubmit}>
      <TextInput
        label="Email"
        type="email"
        placeholder="emilejames@gmail.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
      />
      {errorMessage ? <p className="mt-3 text-sm text-red-600">{errorMessage}</p> : null}
      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[var(--logo-red)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--logo-red)]/20 transition-smooth hover:bg-[var(--logo-red-dark)] disabled:opacity-60"
      >
        {status === "loading" ? "Envoi…" : "Envoyer le code de réinitialisation"}
      </button>
      <p className="mt-3 text-xs text-gray-500">
        Enregistrement de la demande côté plateforme + notification équipe si SMTP configuré.
      </p>
    </form>
  );
}
