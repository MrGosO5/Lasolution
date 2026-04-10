"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Reveal } from "@/app/site/components/Reveal";
import { PageHeader } from "@/app/site/components/UI";

type NotifItem = {
  id: string;
  kind: string;
  title: string;
  body: string;
  at: string;
  atLabel: string;
  href: string;
};

export default function NotificationsPage() {
  const { status } = useSession();
  const [items, setItems] = useState<NotifItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me/notifications");
        const data = (await res.json()) as { items?: NotifItem[]; error?: string };
        if (!res.ok) {
          if (!cancelled) setError(data.error || "Impossible de charger les notifications.");
          return;
        }
        if (!cancelled) setItems(Array.isArray(data.items) ? data.items : []);
      } catch {
        if (!cancelled) setError("Réseau indisponible.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-14 md:py-16">
      <Reveal>
        <PageHeader
          eyebrow="Mon espace"
          title="Notifications"
          subtitle="Événements issus de vos commandes et du suivi colis (données réelles lorsque la base est branchée)."
        />
      </Reveal>

      {status === "loading" || (status === "authenticated" && items === null && !error) ? (
        <p className="mt-10 text-sm text-gray-600">Chargement…</p>
      ) : null}

      {error ? (
        <p className="mt-10 text-sm text-red-700 rounded-xl bg-red-50 px-4 py-3 ring-1 ring-red-200">{error}</p>
      ) : null}

      {items && items.length === 0 && !error ? (
        <div className="mt-10 rounded-2xl bg-white/70 ring-1 ring-black/5 shadow-sm p-6 text-sm text-gray-600">
          <p>Aucune notification pour le moment.</p>
          <p className="mt-2">
            Dès qu’une commande évolue ou qu’un suivi colis est mis à jour, les entrées apparaîtront ici.
          </p>
          <Link href="/boutiques" className="mt-4 inline-block text-sm font-semibold text-gray-900 underline underline-offset-2">
            Parcourir les boutiques
          </Link>
        </div>
      ) : null}

      {items && items.length > 0 ? (
        <div className="mt-10 grid gap-3">
          {items.map((n, idx) => (
            <Reveal key={n.id} delayMs={Math.min(70 * idx, 400)}>
              <Link
                href={n.href}
                className="block rounded-2xl bg-white/70 ring-1 ring-black/5 shadow-sm p-5 transition-smooth hover:shadow-lg hover:shadow-gray-200/40"
              >
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                    <p className="mt-1 text-sm text-gray-600">{n.body}</p>
                    {n.kind === "tracking" ? (
                      <p className="mt-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Suivi</p>
                    ) : null}
                  </div>
                  <p className="text-xs text-gray-500 shrink-0">{n.atLabel}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      ) : null}
    </main>
  );
}
