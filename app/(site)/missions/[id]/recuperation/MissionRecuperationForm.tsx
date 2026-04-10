"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { TextArea } from "@/app/site/components/Form";

const REASONS = [
  {
    id: "vol",
    t: "Je n’ai pas pu prendre mon vol",
    d: "ex : vol annulé, empêchement personnel, problème administratif",
  },
  {
    id: "livrer",
    t: "Je suis arrivé à destination mais je ne peux pas livrer",
    d: "ex : impossibilité d'accès, imprévu logistique, changement de programme",
  },
] as const;

export function MissionRecuperationForm({ missionId }: { missionId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState<(typeof REASONS)[number]["id"]>("vol");
  const [detail, setDetail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/mission-solupacker-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missionId,
          type: "recuperation",
          payload: { reason, detail },
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error || "Enregistrement impossible.");
        return;
      }
      router.push(`/missions/${missionId}/recuperation/confirmation`);
    } catch {
      setStatus("error");
      setErrorMessage("Réseau indisponible.");
    }
  }

  return (
    <form className="card p-6 md:p-7 grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-3">
        {REASONS.map((r) => (
          <label key={r.id} className="flex items-start gap-3 card bg-white/80 p-5 cursor-pointer">
            <input
              type="radio"
              name="reason"
              checked={reason === r.id}
              onChange={() => setReason(r.id)}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-semibold text-gray-900">{r.t}</span>
              <span className="mt-1 block text-xs text-gray-500">{r.d}</span>
            </span>
          </label>
        ))}
      </div>

      <TextArea label="Motif détaillé" placeholder="Entrez votre motif…" value={detail} onChange={(e) => setDetail(e.target.value)} />

      <div className="card bg-white/80 p-5">
        <p className="text-sm font-semibold text-gray-900">Adresse de récupération</p>
        <p className="mt-2 text-sm text-gray-700">13 Rue Jean Jaurès, Paris, France</p>
        <p className="mt-1 text-xs text-gray-500">25 Juin 2025, 13h00 — +33 152629176</p>
        <div className="mt-3 rounded-2xl bg-[rgba(245,158,11,0.12)] px-4 py-3 text-sm text-amber-900">
          Votre commission pourrait être réajustée selon la distance parcourue et l’effort fourni.
        </div>
      </div>

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

      <button type="submit" disabled={status === "loading"} className="mt-2 btn btn-dark disabled:opacity-60">
        {status === "loading" ? "Envoi…" : "Confirmer la demande"}
      </button>
      <p className="text-xs text-gray-500">Demande enregistrée (SecurityEvent) + email équipe si SMTP.</p>
    </form>
  );
}
