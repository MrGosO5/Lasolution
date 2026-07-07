"use client";

import { useState } from "react";
import { fetchWithBackendAuth } from "@/lib/client-backend-token";

export function MfaSetupPanel() {
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function startSetup() {
    setStatus(null);
    const res = await fetchWithBackendAuth("/api/auth/mfa/setup", { method: "POST" });
    const data = (await res.json()) as { qrDataUrl?: string; secret?: string; error?: string };
    if (!res.ok) {
      setStatus(data.error || "Impossible d'initialiser la MFA.");
      return;
    }
    setQr(data.qrDataUrl || null);
    setSecret(data.secret || null);
  }

  async function confirm() {
    const res = await fetchWithBackendAuth("/api/auth/mfa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setStatus(data.error || "Code invalide.");
      return;
    }
    setStatus("MFA activée avec succès.");
    setQr(null);
    setSecret(null);
    setCode("");
  }

  return (
    <div className="grid gap-4 rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold">Authentification à deux facteurs (TOTP)</h2>
      <p className="text-sm text-gray-600">
        Recommandé pour les comptes administrateur. Utilisez Google Authenticator ou une application compatible.
      </p>
      {!qr ? (
        <button type="button" className="btn btn-primary w-fit" onClick={() => void startSetup()}>
          Configurer la MFA
        </button>
      ) : (
        <div className="grid gap-3">
          {qr ? <img src={qr} alt="QR code MFA" className="h-48 w-48" /> : null}
          {secret ? (
            <p className="text-xs text-gray-500 break-all">
              Secret manuel : <code>{secret}</code>
            </p>
          ) : null}
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Code à 6 chiffres"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button type="button" className="btn btn-primary w-fit" onClick={() => void confirm()}>
            Activer
          </button>
        </div>
      )}
      {status ? <p className="text-sm text-gray-700">{status}</p> : null}
    </div>
  );
}
