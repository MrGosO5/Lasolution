"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

function apiBase() {
  return (process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:4000").replace(/\/$/, "");
}

function dismissKey(orderId: string) {
  return `lasolution_testimonial_dismiss_${orderId}`;
}

function autoShownKey(orderId: string) {
  return `lasolution_testimonial_autoshown_${orderId}`;
}

type Props = {
  orderId: string;
  /** Commande considérée livrée (statut ou colis) */
  orderDelivered: boolean;
  /** Déjà en base */
  testimonialSubmitted: boolean;
};

export function OrderTestimonialPrompt({ orderId, orderDelivered, testimonialSubmitted }: Props) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<string>("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submittedLocal, setSubmittedLocal] = useState(false);

  const isClient = session?.user?.role === "client";
  const accessToken = session?.user?.accessToken;

  const eligible = Boolean(orderDelivered && !testimonialSubmitted && !submittedLocal && isClient);

  const canShowManual = useMemo(() => {
    return status === "authenticated" && isClient && orderDelivered && !testimonialSubmitted && !submittedLocal;
  }, [status, isClient, orderDelivered, testimonialSubmitted, submittedLocal]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (status !== "authenticated" || !isClient) return;
    if (!eligible) return;
    if (localStorage.getItem(dismissKey(orderId))) return;
    if (localStorage.getItem(autoShownKey(orderId))) return;
    const t = window.setTimeout(() => setOpen(true), 500);
    return () => window.clearTimeout(t);
  }, [orderId, status, isClient, eligible]);

  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    localStorage.setItem(autoShownKey(orderId), "1");
  }, [open, orderId]);

  const closeDismiss = useCallback(() => {
    setOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(dismissKey(orderId), "1");
    }
  }, [orderId]);

  const validate = useCallback(() => {
    const n = clientName.trim();
    const c = city.trim();
    const co = country.trim();
    const m = message.trim();
    if (!n) return "Le nom du client est obligatoire.";
    if (!c) return "La ville est obligatoire.";
    if (!co) return "Le pays est obligatoire.";
    if (m.length < 20) return "Le témoignage doit contenir au moins 20 caractères.";
    if (rating && rating !== "") {
      const r = Number(rating);
      if (Number.isNaN(r) || r < 1 || r > 5) return "La note doit être entre 1 et 5.";
    }
    return null;
  }, [clientName, city, country, message, rating]);

  async function submit() {
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    if (!accessToken) {
      setError("Session expirée. Reconnectez-vous.");
      return;
    }
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        clientName: clientName.trim(),
        city: city.trim(),
        country: country.trim(),
        message: message.trim(),
      };
      if (rating && rating !== "") body.rating = Number(rating);
      if (photoDataUrl) body.photoDataUrl = photoDataUrl;

      const res = await fetch(`${apiBase()}/orders/${encodeURIComponent(orderId)}/testimonials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
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
      setSubmittedLocal(true);
      setOpen(false);
      if (typeof window !== "undefined") {
        localStorage.removeItem(dismissKey(orderId));
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") return null;
  if (!isClient || !orderDelivered) return null;
  if (testimonialSubmitted || submittedLocal) return null;

  return (
    <>
      {canShowManual ? (
        <div className="mt-4 rounded-2xl bg-[rgba(195,35,83,0.08)] ring-1 ring-[var(--logo-red)]/20 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-gray-800">
            Votre commande est livrée. Un avis nous aide à améliorer le service.
          </p>
          <button type="button" className="btn btn-primary shrink-0" onClick={() => setOpen(true)}>
            Donner mon avis
          </button>
        </div>
      ) : null}

      {open ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="testimonial-title"
        >
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl ring-1 ring-black/10 p-6 md:p-8">
            <button
              type="button"
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-900 text-xl leading-none"
              aria-label="Fermer"
              onClick={closeDismiss}
            >
              ×
            </button>
            <h2 id="testimonial-title" className="text-lg font-semibold text-gray-900 pr-8">
              Votre avis compte
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Partagez votre expérience (champs marqués * sont obligatoires). Vous ne pourrez envoyer qu’un seul avis pour
              cette commande.
            </p>

            {error ? <p className="mt-3 text-sm text-red-700 rounded-xl bg-red-50 px-3 py-2 ring-1 ring-red-200">{error}</p> : null}

            <div className="mt-5 grid gap-4">
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-gray-800">Nom du client *</span>
                <input
                  className="rounded-xl border border-black/10 px-3 py-2 text-gray-900"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  autoComplete="name"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-gray-800">Ville *</span>
                <input
                  className="rounded-xl border border-black/10 px-3 py-2 text-gray-900"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  autoComplete="address-level2"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-gray-800">Pays *</span>
                <input
                  className="rounded-xl border border-black/10 px-3 py-2 text-gray-900"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  autoComplete="country-name"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-gray-800">Message / témoignage * (min. 20 caractères)</span>
                <textarea
                  className="min-h-[120px] rounded-xl border border-black/10 px-3 py-2 text-gray-900"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-gray-800">Note (optionnel, 1 à 5)</span>
                <select
                  className="rounded-xl border border-black/10 px-3 py-2 text-gray-900"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                >
                  <option value="">—</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={String(n)}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-gray-800">Photo (optionnel, JPG/PNG, max 5 Mo)</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  className="text-sm"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) {
                      setPhotoDataUrl(null);
                      return;
                    }
                    if (file.size > 5 * 1024 * 1024) {
                      setError("La photo doit faire au plus 5 Mo.");
                      setPhotoDataUrl(null);
                      return;
                    }
                    const dataUrl = await new Promise<string>((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onload = () => resolve(String(reader.result || ""));
                      reader.onerror = () => reject(new Error("READ_ERROR"));
                      reader.readAsDataURL(file);
                    }).catch(() => "");
                    setPhotoDataUrl(dataUrl || null);
                    setError(null);
                  }}
                />
              </label>
            </div>

            <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button type="button" className="btn btn-ghost" onClick={closeDismiss} disabled={loading}>
                Plus tard
              </button>
              <button type="button" className="btn btn-dark" onClick={() => void submit()} disabled={loading}>
                {loading ? "Envoi…" : "Envoyer mon avis"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
