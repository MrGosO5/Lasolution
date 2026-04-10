"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  async function handleCancel() {
    setState("loading");
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push(`/mes-commandes/${orderId}/annuler/confirmation`);
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
      {state === "error" && (
        <p className="text-sm text-red-600">{errorMsg}</p>
      )}
      <button
        type="button"
        onClick={handleCancel}
        disabled={state === "loading"}
        className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {state === "loading" ? "Annulation en cours…" : "Oui, annuler la commande"}
      </button>
    </div>
  );
}
