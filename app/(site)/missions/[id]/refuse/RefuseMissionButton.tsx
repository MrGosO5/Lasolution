"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RefuseMissionButton({ missionId }: { missionId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  async function handleRefuse() {
    setState("loading");
    try {
      const res = await fetch(`/api/missions/${missionId}/refuse`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push(`/missions?refused=1`);
      } else {
        setErrorMsg(data.error || "Une erreur est survenue.");
        setState("error");
      }
    } catch {
      setErrorMsg("Erreur réseau. Réessayez.");
      setState("error");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {state === "error" && <p className="text-sm text-red-600">{errorMsg}</p>}
      <button
        type="button"
        onClick={handleRefuse}
        disabled={state === "loading"}
        className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {state === "loading" ? "Refus en cours…" : "Oui, refuser la mission"}
      </button>
    </div>
  );
}
