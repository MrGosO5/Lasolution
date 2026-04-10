"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Select, TextArea } from "@/app/site/components/Form";

export function MissionReceptionForm({ missionId }: { missionId: string }) {
  const router = useRouter();
  const [packaging, setPackaging] = useState("Légèrement abîmé");
  const [content, setContent] = useState("Conforme à la déclaration");
  const [anomaly, setAnomaly] = useState("");
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
          type: "reception",
          payload: { packaging, content, anomalyDetail: anomaly },
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error || "Enregistrement impossible.");
        return;
      }
      router.push(`/missions/${missionId}/reception/confirmation`);
    } catch {
      setStatus("error");
      setErrorMessage("Réseau indisponible.");
    }
  }

  return (
    <form className="card p-6 md:p-7 grid gap-4" onSubmit={onSubmit}>
      <Select label="État de l'emballage" value={packaging} onChange={(e) => setPackaging(e.target.value)}>
        <option>Intact</option>
        <option>Légèrement abîmé</option>
        <option>Très abîmé</option>
      </Select>
      <Select label="État du contenu" value={content} onChange={(e) => setContent(e.target.value)}>
        <option>Conforme à la déclaration</option>
        <option>Incomplet</option>
        <option>Endommagé</option>
      </Select>
      <TextArea
        label="Détail des anomalies (optionnel)"
        placeholder="Ex: la boîte était légèrement ouverte, produit intact…"
        value={anomaly}
        onChange={(e) => setAnomaly(e.target.value)}
      />

      <div className="card bg-white/80 p-5">
        <p className="text-sm font-semibold text-gray-900">Photo du colis</p>
        <p className="mt-1 text-xs text-gray-500">Upload à brancher — la validation ci-dessous enregistre déjà le rapport.</p>
        <button type="button" className="mt-3 btn btn-dark opacity-60 cursor-not-allowed" disabled>
          Téléverser la photo du colis
        </button>
      </div>

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

      <button type="submit" disabled={status === "loading"} className="mt-2 btn btn-primary disabled:opacity-60">
        {status === "loading" ? "Envoi…" : "Valider la réception"}
      </button>
      <p className="text-xs text-gray-500">Rapport enregistré (SecurityEvent) + email équipe si SMTP.</p>
    </form>
  );
}
