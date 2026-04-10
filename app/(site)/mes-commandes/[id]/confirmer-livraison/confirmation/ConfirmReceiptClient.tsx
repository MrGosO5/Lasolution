"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

function apiBase() {
  return (process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:4000").replace(/\/$/, "");
}

export function ConfirmReceiptClient({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    const token = session?.user?.accessToken;
    if (!token) {
      setError("Session expirée. Reconnectez-vous.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase()}/orders/${encodeURIComponent(orderId)}/confirm-receipt`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await res.text();
      if (!res.ok) {
        try {
          const j = JSON.parse(text) as { error?: string };
          throw new Error(j.error || text);
        } catch (e) {
          if (e instanceof Error && e.message !== text) throw e;
          throw new Error(text || `HTTP ${res.status}`);
        }
      }
      router.push(`/mes-commandes/${encodeURIComponent(orderId)}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-10 card p-8 text-center">
      {error ? <p className="mb-4 text-sm text-red-700 rounded-xl bg-red-50 px-4 py-3 ring-1 ring-red-200">{error}</p> : null}
      {status === "loading" ? (
        <p className="text-sm text-gray-600">Chargement…</p>
      ) : session?.user?.accessToken ? (
        <button type="button" className="btn btn-dark" onClick={() => void confirm()} disabled={loading}>
          {loading ? "Confirmation…" : "Confirmer la réception"}
        </button>
      ) : (
        <p className="text-sm text-gray-700">
          <Link href="/connexion" className="font-semibold text-[var(--logo-red)]">
            Connectez-vous
          </Link>{" "}
          pour confirmer la réception.
        </p>
      )}
      <div className="mt-4">
        <Link href={`/mes-commandes/${orderId}`} className="text-sm text-gray-600 underline">
          Retour à la commande
        </Link>
      </div>
    </div>
  );
}
