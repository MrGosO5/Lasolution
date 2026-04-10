"use client";

import { useState, type FormEvent } from "react";
import { Select, TextInput, Toggle } from "@/app/site/components/Form";

export function ProchainVoyageForm() {
  const [departCountry, setDepartCountry] = useState("France");
  const [departCity, setDepartCity] = useState("");
  const [destCountry, setDestCountry] = useState("Bénin");
  const [destCity, setDestCity] = useState("");
  const [departDate, setDepartDate] = useState("");
  const [arriveDate, setArriveDate] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [certified, setCertified] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/trip-declaration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departCountry,
          departCity,
          destCountry,
          destCity,
          departDate,
          arriveDate,
          flightNumber,
          weightKg,
          contactEmail,
          certified,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error || "Enregistrement impossible.");
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
      <div className="rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-sm p-6 md:p-7">
        <p className="text-sm font-semibold text-gray-900">Voyage enregistré</p>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Votre déclaration a été enregistrée. L’équipe pourra vous proposer des missions adaptées à votre trajet.
        </p>
        <button
          type="button"
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition-smooth hover:bg-black"
          onClick={() => {
            setStatus("idle");
            setDepartCity("");
            setDestCity("");
            setDepartDate("");
            setArriveDate("");
            setFlightNumber("");
            setWeightKg("");
            setContactEmail("");
            setCertified(false);
          }}
        >
          Déclarer un autre voyage
        </button>
      </div>
    );
  }

  return (
    <form className="rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-sm p-6 md:p-7 grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <Select label="Pays de départ" value={departCountry} onChange={(e) => setDepartCountry(e.target.value)}>
          <option>France</option>
          <option>Belgique</option>
        </Select>
        <TextInput label="Ville de départ" placeholder="Paris" value={departCity} onChange={(e) => setDepartCity(e.target.value)} required />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Select label="Pays de destination" value={destCountry} onChange={(e) => setDestCountry(e.target.value)}>
          <option>Bénin</option>
          <option>Togo</option>
          <option>Sénégal</option>
          <option>Côte d’Ivoire</option>
        </Select>
        <TextInput label="Ville de destination" placeholder="Cotonou" value={destCity} onChange={(e) => setDestCity(e.target.value)} required />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput label="Date de départ" placeholder="12 Juin 2025" value={departDate} onChange={(e) => setDepartDate(e.target.value)} />
        <TextInput label="Date d’arrivée" placeholder="12 Juin 2025" value={arriveDate} onChange={(e) => setArriveDate(e.target.value)} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput label="Numéro de vol" placeholder="EZS8481" value={flightNumber} onChange={(e) => setFlightNumber(e.target.value)} />
        <TextInput
          label="Poids disponible (kg)"
          placeholder="3"
          inputMode="decimal"
          value={weightKg}
          onChange={(e) => setWeightKg(e.target.value)}
        />
      </div>
      <TextInput
        label="Email de contact (optionnel)"
        type="email"
        placeholder="vous@email.com"
        value={contactEmail}
        onChange={(e) => setContactEmail(e.target.value)}
      />

      <div className="mt-1">
        <Toggle
          label="En déclarant ce voyage, je certifie l’exactitude des informations et accepte de transporter des colis dans le respect des règles."
          value={certified}
          onChange={setCertified}
        />
      </div>

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-2 inline-flex items-center justify-center rounded-xl bg-[var(--logo-red)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--logo-red)]/20 transition-smooth hover:bg-[var(--logo-red-dark)] disabled:opacity-60"
      >
        {status === "loading" ? "Envoi…" : "Déclarer mon voyage"}
      </button>
      <p className="text-xs text-gray-500">
        Enregistrement côté plateforme (événement + email équipe si SMTP configuré). Matching missions à brancher ensuite.
      </p>
    </form>
  );
}
