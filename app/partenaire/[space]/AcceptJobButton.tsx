"use client";

import { useState } from "react";

export function AcceptJobButton({ jobId }: { jobId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function accept() {
    setState("loading");
    try {
      const res = await fetch(`/api/delivery-jobs/${jobId}/accept`, { method: "POST" });
      if (res.ok) {
        setState("done");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return <span className="text-xs font-semibold text-[#218922]">Accepté ✓</span>;
  }
  if (state === "error") {
    return <span className="text-xs font-semibold text-red-600">Erreur — réessayez</span>;
  }

  return (
    <button
      type="button"
      onClick={accept}
      disabled={state === "loading"}
      className="px-3 py-1.5 text-xs font-semibold bg-figma-activeMenu text-white rounded-input hover:opacity-90 transition-opacity disabled:opacity-50"
    >
      {state === "loading" ? "…" : "Accepter"}
    </button>
  );
}
