"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Reveal } from "@/app/site/components/Reveal";
import { Select, TextInput } from "@/app/site/components/Form";
import { PhoneInput } from "@/app/site/components/PhoneInput";
import { ensurePhoneWithDial } from "@/lib/phone-country";

export type MePayload = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  profile: Record<string, unknown> | null;
};

function readProfileString(p: Record<string, unknown> | null | undefined, key: string): string {
  const v = p?.[key];
  return typeof v === "string" ? v : "";
}

function splitName(full: string | null | undefined) {
  const s = (full || "").trim();
  if (!s) return { firstName: "", lastName: "" };
  const parts = s.split(/\s+/);
  return { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") };
}

export function MonProfilForm({
  initial,
  fallbackEmail,
  fallbackName,
}: {
  initial: MePayload | null;
  fallbackEmail: string;
  fallbackName: string;
}) {
  const prof = initial?.profile;
  const fromName = splitName(initial?.name ?? fallbackName);
  const [firstName, setFirstName] = useState(readProfileString(prof, "firstName") || fromName.firstName);
  const [lastName, setLastName] = useState(readProfileString(prof, "lastName") || fromName.lastName);
  const [email] = useState(initial?.email ?? fallbackEmail);
  const [phone, setPhone] = useState(() =>
    ensurePhoneWithDial(readProfileString(prof, "phone"), readProfileString(prof, "country") || "Bénin"),
  );
  const [country, setCountry] = useState(readProfileString(prof, "country") || "Bénin");
  const [city, setCity] = useState(readProfileString(prof, "city"));
  const [district, setDistrict] = useState(readProfileString(prof, "district"));
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage(null);
    const displayName = `${firstName} ${lastName}`.trim() || email;
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: displayName,
          profile: {
            firstName,
            lastName,
            phone,
            country,
            city,
            district,
          },
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error || "Enregistrement impossible.");
        return;
      }
      setStatus("success");
      setTimeout(() => setStatus("idle"), 4000);
    } catch {
      setStatus("error");
      setErrorMessage("Réseau indisponible.");
    }
  }

  return (
    <div className="mt-10 grid gap-6 md:grid-cols-[1fr_0.85fr]">
      <Reveal>
        <form className="rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-sm p-6 md:p-7 grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput label="Nom" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            <TextInput label="Prénom" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput label="Email" type="email" value={email} readOnly className="opacity-80" />
            <PhoneInput
              label="Numéro de téléphone"
              value={phone}
              onChange={setPhone}
              country={country}
            />
          </div>
          <p className="text-xs text-gray-500 -mt-2">L’email n’est pas modifiable depuis cet écran pour l’instant.</p>
          <div className="grid gap-4 md:grid-cols-3">
            <Select label="Pays" value={country} onChange={(e) => setCountry(e.target.value)}>
              <option>Bénin</option>
              <option>Togo</option>
              <option>Sénégal</option>
              <option>Côte d’Ivoire</option>
              <option>France</option>
            </Select>
            <TextInput label="Ville" placeholder="Cotonou" value={city} onChange={(e) => setCity(e.target.value)} />
            <TextInput
              label="Quartier"
              placeholder="Fidjrossè"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            />
          </div>

          {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
          {status === "success" ? (
            <p className="text-sm text-emerald-700">Modifications enregistrées.</p>
          ) : null}

          <button
            type="submit"
            disabled={status === "loading"}
            className="mt-2 inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/15 transition-smooth hover:bg-black disabled:opacity-60"
          >
            {status === "loading" ? "Enregistrement…" : "Enregistrer les modifications"}
          </button>
          <p className="text-xs text-gray-500">Données stockées sur votre compte (champ profil JSON côté API).</p>
        </form>
      </Reveal>

      <Reveal delayMs={120}>
        <div className="rounded-3xl bg-gradient-to-br from-white/85 to-white/55 ring-1 ring-black/5 shadow-xl shadow-gray-200/40 p-6 md:p-7">
          <p className="text-xs font-semibold tracking-wide text-gray-600 uppercase">Devenir partenaire</p>
          <div className="mt-4 grid gap-3">
            <Link
              href="/devenir-point-relai"
              className="rounded-2xl bg-white/80 ring-1 ring-black/5 p-5 text-sm font-semibold text-gray-900 transition-smooth hover:bg-white"
            >
              Devenir Point relai →
            </Link>
            <div className="rounded-2xl bg-white/80 ring-1 ring-black/5 p-5">
              <p className="text-sm font-semibold text-gray-900">Devenir Solupacker</p>
              <p className="mt-2 text-sm text-gray-600">Devenez Solupacker et rentabilisez vos déplacements.</p>
            </div>
          </div>

          <div className="mt-6 relative h-36 w-full">
            <Image src="/icon/client_photo.svg" alt="Profil" fill className="object-contain" />
          </div>
        </div>
      </Reveal>
    </div>
  );
}
