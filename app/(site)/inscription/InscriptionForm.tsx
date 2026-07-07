"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Select, TextInput, Toggle } from "@/app/site/components/Form";
import { TurnstileWidget } from "@/app/site/components/TurnstileWidget";

export function InscriptionForm() {
  const router = useRouter();
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("France");
  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!captchaToken) {
      setStatus("error");
      setErrorMessage("Veuillez compléter la vérification anti-robot.");
      return;
    }
    setStatus("loading");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lastName,
          firstName,
          email,
          country,
          password,
          acceptTerms,
          captchaToken,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error || "Inscription impossible.");
        return;
      }
      router.push(`/verifier-email?email=${encodeURIComponent(email.trim())}`);
    } catch {
      setStatus("error");
      setErrorMessage("Réseau indisponible.");
    }
  }

  return (
    <form className="mt-8 grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput label="Nom" placeholder="James" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        <TextInput label="Prénom" placeholder="Emile" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput
          label="Email"
          type="email"
          placeholder="emilejames@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Select label="Pays" value={country} onChange={(e) => setCountry(e.target.value)}>
          <option>France</option>
          <option>Bénin</option>
          <option>Togo</option>
          <option>Sénégal</option>
          <option>Côte d’Ivoire</option>
        </Select>
      </div>
      <TextInput
        label="Mot de passe"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={12}
        autoComplete="new-password"
      />

      <div className="mt-1">
        <Toggle
          label="J’accepte les conditions générales et la politique de confidentialité."
          value={acceptTerms}
          onChange={setAcceptTerms}
        />
      </div>

      <TurnstileWidget onToken={setCaptchaToken} className="mt-2 flex justify-center" />

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-2 inline-flex items-center justify-center rounded-xl bg-[var(--logo-red)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--logo-red)]/20 transition-smooth hover:bg-[var(--logo-red-dark)] disabled:opacity-60"
      >
        {status === "loading" ? "Création…" : "Créer un compte"}
      </button>

      <p className="text-sm text-gray-600">
        Vous avez déjà un compte ?{" "}
        <Link className="font-semibold text-gray-900 hover:underline" href="/connexion">
          Connectez-vous
        </Link>
      </p>
      <p className="text-xs text-gray-500">
        Compte client créé en base (mot de passe chiffré). Les comptes démo par mot de passe partagé restent disponibles pour les tests.
      </p>
    </form>
  );
}
