"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ConfirmDeliveryButton({ orderId }: { orderId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  async function handleConfirm() {
    setState("loading");
    try {
      const res = await fetch(`/api/orders/${orderId}/confirm-receipt`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push(`/mes-commandes/${orderId}/confirmer-livraison/confirmation`);
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
        onClick={handleConfirm}
        disabled={state === "loading"}
        className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {state === "loading" ? "Confirmation en cours…" : "Oui, confirmer la réception"}
      </button>
    </div>
  );
}
