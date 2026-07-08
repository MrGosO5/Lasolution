"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "expedition_flash";

export function MesExpeditionsFlash() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      setMessage(stored);
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  if (!message) return null;

  const isWarning = /email|notification|avertissement/i.test(message);

  return (
    <div
      className={
        isWarning
          ? "card p-5 md:p-6 ring-1 ring-amber-200 bg-amber-50/80"
          : "card p-5 md:p-6 ring-1 ring-emerald-200 bg-emerald-50/80"
      }
    >
      <p className={`text-sm font-semibold ${isWarning ? "text-amber-950" : "text-emerald-950"}`}>
        {isWarning ? "Demande enregistrée" : "Demande envoyée avec succès"}
      </p>
      <p className={`mt-2 text-sm leading-relaxed ${isWarning ? "text-amber-900" : "text-emerald-900"}`}>{message}</p>
    </div>
  );
}
