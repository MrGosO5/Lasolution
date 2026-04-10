"use client";

import emailjs from "@emailjs/browser";
import { useState, type FormEvent } from "react";
import { FieldLabel, Select, TextInput } from "@/app/site/components/Form";

const COUNTRY_OPTIONS = [
  "Bénin",
  "Sénégal",
  "Gabon",
  "Cameroon",
] as const;

const DIAL_BY_COUNTRY: Record<(typeof COUNTRY_OPTIONS)[number], string> = {
  Bénin: "+229",
  Sénégal: "+221",
  Gabon: "+241",
  Cameroon: "+237",
};

const EMAILJS_SERVICE_ID = "service_kkkjvub";
const EMAILJS_TEMPLATE_ID = "template_4pjyp9j";
const EMAILJS_PUBLIC_KEY = "VCHCjKh9Rul3hZMaf";

function nationalPhonePlaceholder(pays: string): string {
  return pays === "Cameroon" ? "6 12 34 56 78" : "Numéro sans indicatif";
}

function buildFullPhone(pays: string, indicatif: string, national: string): string {
  const t = national.trim();
  if (!t) return "";
  const digits = t.replace(/\s/g, "");
  const withoutLeadingZero = /^0\d{8,}$/.test(digits) ? digits.slice(1) : digits;
  return `${indicatif} ${withoutLeadingZero}`;
}

export function PriseDeContactForm() {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [pays, setPays] = useState<string>(COUNTRY_OPTIONS[0]);
  const [telephone, setTelephone] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage(null);

    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      setStatus("error");
      setErrorMessage(
        "L’envoi d’e-mails n’est pas configuré (variables NEXT_PUBLIC_EMAILJS_*). Ajoutez-les dans .env.local."
      );
      return;
    }

    const indicatif = DIAL_BY_COUNTRY[pays as keyof typeof DIAL_BY_COUNTRY] ?? "—";
    const telephoneComplet = buildFullPhone(pays, indicatif, telephone);

    try {
      await emailjs.send(serviceId, templateId, {
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.trim(),
        pays,
        indicatif,
        telephone: telephone.trim(),
        telephone_complet: telephoneComplet,
        sujet: "Nouvelle prise de contact — formulaire site",
      }, publicKey);
      setStatus("success");
      setNom("");
      setPrenom("");
      setEmail("");
      setTelephone("");
      setPays(COUNTRY_OPTIONS[0]);
    } catch {
      setStatus("error");
      setErrorMessage("Envoi impossible. Vérifiez la configuration EmailJS ou réessayez plus tard.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-sm p-6 md:p-7">
        <p className="text-sm font-semibold text-gray-900">Demande envoyée</p>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Merci. Vos coordonnées ont bien été transmises à notre équipe. Nous vous recontacterons rapidement.
        </p>
        <button
          type="button"
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition-smooth hover:bg-black"
          onClick={() => setStatus("idle")}
        >
          Envoyer une autre demande
        </button>
      </div>
    );
  }

  return (
    <form className="rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-sm p-6 md:p-7 grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput label="Nom" placeholder="Dupont" value={nom} onChange={(e) => setNom(e.target.value)} required />
        <TextInput label="Prénom" placeholder="Marie" value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
      </div>
      <TextInput
        label="Email"
        type="email"
        placeholder="vous@exemple.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
      />
      <Select label="Pays" value={pays} onChange={(e) => setPays(e.target.value)} required>
        {COUNTRY_OPTIONS.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>

      <div className="grid gap-4 md:grid-cols-[7.5rem_1fr] md:items-end">
        <label className="grid gap-2">
          <FieldLabel>Indicatif</FieldLabel>
          <input
            type="text"
            readOnly
            aria-readonly="true"
            tabIndex={-1}
            value={DIAL_BY_COUNTRY[pays as keyof typeof DIAL_BY_COUNTRY] ?? "—"}
            className="h-11 w-full cursor-default rounded-xl bg-gray-100/90 ring-1 ring-black/10 px-4 text-sm font-medium text-gray-800 select-none"
          />
        </label>
        <TextInput
          label="Numéro"
          type="tel"
          placeholder={nationalPhonePlaceholder(pays)}
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
          autoComplete="tel-national"
          required
        />
      </div>
      {errorMessage ? (
        <p className="text-sm text-red-700 rounded-xl bg-red-50 px-4 py-3 ring-1 ring-red-200">{errorMessage}</p>
      ) : null}
      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-2 inline-flex items-center justify-center rounded-xl bg-[var(--logo-red)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--logo-red)]/20 transition-smooth hover:bg-[var(--logo-red-dark)] disabled:opacity-60"
      >
        {status === "loading" ? "Envoi…" : "Envoyer"}
      </button>
      <p className="text-xs text-gray-500 leading-relaxed">
        En envoyant ce formulaire, vous acceptez que nous utilisions ces informations pour vous recontacter concernant La
        Solution.
      </p>
    </form>
  );
}
