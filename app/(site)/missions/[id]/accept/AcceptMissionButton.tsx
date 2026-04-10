"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AcceptMissionButton({ missionId }: { missionId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  async function handleAccept() {
    setState("loading");
    try {
      const res = await fetch(`/api/missions/${missionId}/accept`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push(`/missions/${missionId}?accepted=1`);
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
        onClick={handleAccept}
        disabled={state === "loading"}
        className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {state === "loading" ? "Acceptation en cours…" : "Oui, accepter la mission"}
      </button>
    </div>
  );
}
