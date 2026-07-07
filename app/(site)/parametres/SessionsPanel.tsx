"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { fetchWithBackendAuth } from "@/lib/client-backend-token";

type SessionRow = {
  id: string;
  userAgent: string | null;
  ip: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  expiresAt: string;
};

export function SessionsPanel() {
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithBackendAuth("/api/auth/sessions");
      const data = (await res.json()) as { sessions?: SessionRow[]; error?: string };
      if (!res.ok) {
        setError(data.error || "Chargement impossible.");
        return;
      }
      setSessions(data.sessions || []);
    } catch {
      setError("Réseau indisponible.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session?.user) void load();
  }, [session?.user]);

  async function revoke(id: string) {
    const res = await fetchWithBackendAuth(`/api/auth/sessions/${id}`, { method: "DELETE" });
    if (res.ok) void load();
  }

  async function revokeAll() {
    const res = await fetchWithBackendAuth("/api/auth/sessions", { method: "DELETE" });
    if (res.ok) void load();
  }

  if (loading) return <p className="text-sm text-gray-600">Chargement des sessions…</p>;
  if (error) return <p className="text-sm text-red-700">{error}</p>;

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-gray-900">Appareils connectés</h3>
        {sessions.length > 1 ? (
          <button type="button" className="text-sm font-semibold text-red-700 hover:underline" onClick={() => void revokeAll()}>
            Tout déconnecter (sauf cet appareil)
          </button>
        ) : null}
      </div>
      {sessions.length === 0 ? (
        <p className="text-sm text-gray-600">Aucune session active.</p>
      ) : (
        <ul className="grid gap-3">
          {sessions.map((s) => (
            <li key={s.id} className="rounded-xl border border-gray-200 p-4 text-sm">
              <p className="font-medium text-gray-900">{s.userAgent || "Navigateur inconnu"}</p>
              <p className="text-gray-600 mt-1">IP : {s.ip || "—"}</p>
              <p className="text-gray-600">Dernière activité : {s.lastUsedAt ? new Date(s.lastUsedAt).toLocaleString("fr-FR") : "—"}</p>
              <button
                type="button"
                className="mt-2 text-sm font-semibold text-red-700 hover:underline"
                onClick={() => void revoke(s.id)}
              >
                Déconnecter cet appareil
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
