"use client";

import { useState, type FormEvent } from "react";
import { TextArea, TextInput, Select } from "@/app/site/components/Form";

type Props = {
  defaultName: string;
  defaultEmail: string;
};

export function SupportContactForm({ defaultName, defaultEmail }: Props) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [topic, setTopic] = useState("commande");
  const [reference, setReference] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, topic, reference, message }),
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error || "Envoi impossible. Réessayez plus tard.");
        return;
      }
      setStatus("success");
      setMessage("");
    } catch {
      setStatus("error");
      setErrorMessage("Réseau indisponible. Vérifiez votre connexion.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-sm p-6 md:p-7">
        <p className="text-sm font-semibold text-gray-900">Message envoyé</p>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Merci. Nous avons bien reçu votre demande et vous répondrons dans les meilleurs délais.
        </p>
        <button
          type="button"
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition-smooth hover:bg-black"
          onClick={() => setStatus("idle")}
        >
          Envoyer un autre message
        </button>
      </div>
    );
  }

  return (
    <form className="rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-sm p-6 md:p-7 grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput label="Nom" placeholder="Votre nom" value={name} onChange={(e) => setName(e.target.value)} required />
        <TextInput
          label="Email"
          type="email"
          placeholder="votre@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Select label="Sujet" value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option value="commande">Commande</option>
          <option value="colis">Colis</option>
          <option value="paiement">Paiement</option>
          <option value="compte">Compte</option>
          <option value="autre">Autre</option>
        </Select>
        <TextInput
          label="Référence (optionnel)"
          placeholder="#12345"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />
      </div>
      <TextArea
        label="Message"
        placeholder="Décrivez votre demande…"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
        rows={5}
      />
      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-2 inline-flex items-center justify-center rounded-xl bg-[var(--logo-red)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--logo-red)]/20 transition-smooth hover:bg-[var(--logo-red-dark)] disabled:opacity-60"
      >
        {status === "loading" ? "Envoi…" : "Envoyer"}
      </button>
      <p className="text-xs text-gray-500">
        Votre message est enregistré côté plateforme ; si une boîte SMTP est configurée (ex. Mailpit en dev), une copie est
        envoyée à l’équipe support.
      </p>
    </form>
  );
}
