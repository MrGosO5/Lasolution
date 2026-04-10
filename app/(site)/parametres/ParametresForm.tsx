"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Reveal } from "@/app/site/components/Reveal";
import { Select, TextInput } from "@/app/site/components/Form";

type Profile = Record<string, unknown> | null;

function readStr(p: Profile, key: string, fallback: string) {
  const v = p?.[key];
  return typeof v === "string" ? v : fallback;
}

export function ParametresForm({ initialProfile }: { initialProfile: Profile }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [language, setLanguage] = useState(readStr(initialProfile, "language", "fr"));
  const [currency, setCurrency] = useState(readStr(initialProfile, "currency", "EUR"));
  const [pwdStatus, setPwdStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [prefStatus, setPrefStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [prefError, setPrefError] = useState<string | null>(null);

  async function onPasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPwdStatus("loading");
    setPwdError(null);
    if (newPassword !== confirmPassword) {
      setPwdStatus("error");
      setPwdError("Les mots de passe ne correspondent pas.");
      return;
    }
    try {
      const res = await fetch("/api/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setPwdStatus("error");
        setPwdError(data.error || "Changement impossible.");
        return;
      }
      setPwdStatus("success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwdStatus("idle"), 5000);
    } catch {
      setPwdStatus("error");
      setPwdError("Réseau indisponible.");
    }
  }

  async function onPrefsSubmit(e: FormEvent) {
    e.preventDefault();
    setPrefStatus("loading");
    setPrefError(null);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: { language, currency },
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setPrefStatus("error");
        setPrefError(data.error || "Enregistrement impossible.");
        return;
      }
      setPrefStatus("success");
      setTimeout(() => setPrefStatus("idle"), 4000);
    } catch {
      setPrefStatus("error");
      setPrefError("Réseau indisponible.");
    }
  }

  return (
    <div className="mt-10 grid gap-4">
      <Reveal>
        <form
          className="rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-sm p-6 md:p-7"
          onSubmit={onPasswordSubmit}
        >
          <h2 className="text-sm font-semibold text-gray-900">Changer mot de passe</h2>
          <div className="mt-4 grid gap-4">
            <TextInput
              label="Mot de passe actuel"
              type="password"
              placeholder="************"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
            <TextInput
              label="Nouveau mot de passe"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
            />
            <TextInput
              label="Confirmer le mot de passe"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
            />
            {pwdError ? <p className="text-sm text-red-600">{pwdError}</p> : null}
            {pwdStatus === "success" ? (
              <p className="text-sm text-emerald-700">Mot de passe mis à jour.</p>
            ) : null}
            <button
              type="submit"
              disabled={pwdStatus === "loading"}
              className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/15 transition-smooth hover:bg-black disabled:opacity-60"
            >
              {pwdStatus === "loading" ? "Envoi…" : "Changer le mot de passe"}
            </button>
            <p className="text-xs text-gray-500">
              Réservé aux comptes créés via l’inscription (mot de passe stocké en base). Les comptes démo utilisent les
              mots de passe partagés du fichier d’environnement.
            </p>
          </div>
        </form>
      </Reveal>

      <Reveal delayMs={120}>
        <form
          className="rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-sm p-6 md:p-7"
          onSubmit={onPrefsSubmit}
        >
          <h2 className="text-sm font-semibold text-gray-900">Langue</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Select label="Choisir la langue" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="fr">Français (FR)</option>
              <option value="en">English (EN)</option>
            </Select>
            <Select label="Devise" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="EUR">Euro (€)</option>
              <option value="USD">Dollar ($)</option>
              <option value="XOF">FCFA (XOF)</option>
            </Select>
          </div>
          {prefError ? <p className="mt-3 text-sm text-red-600">{prefError}</p> : null}
          {prefStatus === "success" ? (
            <p className="mt-3 text-sm text-emerald-700">Préférences enregistrées (appli côté serveur à étendre).</p>
          ) : (
            <p className="mt-3 text-xs text-gray-500">
              Stockées dans le profil JSON ; l’interface globale reste en français jusqu’à internationalisation complète.
            </p>
          )}
          <button
            type="submit"
            disabled={prefStatus === "loading"}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-[var(--logo-red)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--logo-red)]/20 transition-smooth hover:bg-[var(--logo-red-dark)] disabled:opacity-60"
          >
            {prefStatus === "loading" ? "Enregistrement…" : "Enregistrer les préférences"}
          </button>
        </form>
      </Reveal>

      <Reveal delayMs={210}>
        <div className="rounded-3xl bg-gradient-to-br from-white/85 to-white/55 ring-1 ring-black/5 shadow-xl shadow-gray-200/40 p-6 md:p-7">
          <h2 className="text-sm font-semibold text-gray-900">Besoin d’aide ?</h2>
          <p className="mt-2 text-sm text-gray-600">Le support peut vous accompagner pour toute question.</p>
          <Link
            href="/support"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-[var(--logo-red)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--logo-red)]/20 transition-smooth hover:bg-[var(--logo-red-dark)]"
          >
            Contacter le support
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
