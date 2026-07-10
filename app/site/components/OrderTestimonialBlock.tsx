"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { fetchWithBackendAuth } from "@/lib/client-backend-token";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { testimonialPhotoUrl } from "@/lib/testimonial-media";
import type { TestimonialStatus } from "@/lib/testimonial-client";

export type { TestimonialStatus };

export type OrderTestimonialData = {
  id: string;
  clientName: string;
  city: string;
  country: string;
  message: string;
  rating: number | null;
  photoUrl: string | null;
  status: TestimonialStatus;
  rejectReason?: string | null;
  createdAt: string;
};

function apiBase() {
  return (process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:4000").replace(/\/$/, "");
}

function dismissKey(kind: "order" | "shipping", resourceId: string) {
  return `lasolution_testimonial_dismiss_${kind}_${resourceId}`;
}

function autoShownKey(kind: "order" | "shipping", resourceId: string) {
  return `lasolution_testimonial_autoshown_${kind}_${resourceId}`;
}

type Props =
  | {
      orderId: string;
      orderDelivered: boolean;
      testimonial: OrderTestimonialData | null;
    }
  | {
      shippingRequestId: string;
      expeditionDelivered: boolean;
      testimonial: OrderTestimonialData | null;
    };

function resolveProps(props: Props) {
  if ("shippingRequestId" in props) {
    return {
      kind: "shipping" as const,
      resourceId: props.shippingRequestId,
      delivered: props.expeditionDelivered,
      testimonial: props.testimonial,
      createLabel: "Votre expédition est livrée. Un avis nous aide à améliorer le service.",
      formHint: "Partagez votre expérience (champs marqués * sont obligatoires). Un seul avis par expédition.",
    };
  }
  return {
    kind: "order" as const,
    resourceId: props.orderId,
    delivered: props.orderDelivered,
    testimonial: props.testimonial,
    createLabel: "Votre commande est livrée. Un avis nous aide à améliorer le service.",
    formHint: "Partagez votre expérience (champs marqués * sont obligatoires). Un seul avis par commande.",
  };
}

function testimonialApiPath(kind: "order" | "shipping", resourceId: string) {
  if (kind === "shipping") {
    return `${apiBase()}/me/shipping-requests/${encodeURIComponent(resourceId)}/testimonials`;
  }
  return `${apiBase()}/orders/${encodeURIComponent(resourceId)}/testimonials`;
}

export function OrderTestimonialBlock(props: Props) {
  const { kind, resourceId, delivered, testimonial, createLabel, formHint } = resolveProps(props);
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [open, setOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<string>("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [localTestimonial, setLocalTestimonial] = useState<OrderTestimonialData | null>(testimonial);

  useEffect(() => {
    setLocalTestimonial(testimonial);
  }, [testimonial]);

  const isClient = session?.user?.role === "client";
  const accessToken = session?.user?.accessToken;
  const isEdit = Boolean(localTestimonial);
  const canEdit = localTestimonial && localTestimonial.status !== "APPROVED";

  const eligibleCreate = Boolean(delivered && !localTestimonial && isClient);

  const canShowManualCreate = useMemo(() => {
    return status === "authenticated" && eligibleCreate;
  }, [status, eligibleCreate]);

  const fillFormFromTestimonial = useCallback((t: OrderTestimonialData) => {
    setClientName(t.clientName);
    setCity(t.city);
    setCountry(t.country);
    setMessage(t.message);
    setRating(t.rating != null ? String(t.rating) : "");
    setPhotoDataUrl(null);
    setRemovePhoto(false);
    setError(null);
  }, []);

  const openForm = useCallback(
    (mode: "create" | "edit") => {
      if (mode === "edit" && localTestimonial) fillFormFromTestimonial(localTestimonial);
      else {
        setClientName(session?.user?.name || "");
        setCity("");
        setCountry("");
        setMessage("");
        setRating("");
        setPhotoDataUrl(null);
        setRemovePhoto(false);
        setError(null);
      }
      setOpen(true);
    },
    [localTestimonial, fillFormFromTestimonial, session?.user?.name],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (status !== "authenticated" || !isClient) return;
    if (!eligibleCreate) return;
    if (localStorage.getItem(dismissKey(kind, resourceId))) return;
    if (localStorage.getItem(autoShownKey(kind, resourceId))) return;
    const t = window.setTimeout(() => setOpen(true), 500);
    return () => window.clearTimeout(t);
  }, [kind, resourceId, status, isClient, eligibleCreate]);

  useEffect(() => {
    if (!open || typeof window === "undefined" || !eligibleCreate) return;
    localStorage.setItem(autoShownKey(kind, resourceId), "1");
  }, [open, kind, resourceId, eligibleCreate]);

  const closeDismiss = useCallback(() => {
    setOpen(false);
    if (typeof window !== "undefined" && eligibleCreate) {
      localStorage.setItem(dismissKey(kind, resourceId), "1");
    }
  }, [kind, resourceId, eligibleCreate]);

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
      if (isEdit && removePhoto) body.removePhoto = true;

      const res = await fetchWithBackendAuth(testimonialApiPath(kind, resourceId), {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        accessToken,
        update,
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
      setOpen(false);
      if (typeof window !== "undefined" && !isEdit) {
        localStorage.removeItem(dismissKey(kind, resourceId));
      }
      try {
        const saved = JSON.parse(text) as OrderTestimonialData;
        setLocalTestimonial(saved);
      } catch {
        /* ignore parse errors */
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") return null;
  if (!isClient) return null;
  if (!delivered && !localTestimonial) return null;

  const existingPhoto = localTestimonial?.photoUrl ? testimonialPhotoUrl(localTestimonial.photoUrl) : null;

  return (
    <>
      {localTestimonial ? (
        <div className="mt-4 rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-black/5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="text-sm">
              <p className="font-semibold text-gray-900">Votre avis</p>
              <p className="mt-2 text-gray-800 line-clamp-3">“{localTestimonial.message}”</p>
              <p className="mt-1 text-xs opacity-80">
                {localTestimonial.clientName} — {localTestimonial.city}, {localTestimonial.country}
                {localTestimonial.rating != null ? ` · ${localTestimonial.rating}/5` : ""}
              </p>
              {canEdit ? (
                <p className="mt-2 text-xs text-gray-500">
                  Votre avis peut être modifié avant publication.
                </p>
              ) : null}
            </div>
            {existingPhoto ? (
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-1 ring-black/10">
                <Image src={existingPhoto} alt="" fill className="object-cover" sizes="64px" unoptimized />
              </div>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            {canEdit ? (
              <button type="button" className="btn btn-ghost text-sm" onClick={() => openForm("edit")}>
                Modifier mon avis
              </button>
            ) : null}
            <Link href="/mes-avis" className="btn btn-ghost text-sm">
              Voir tous mes avis
            </Link>
          </div>
        </div>
      ) : canShowManualCreate ? (
        <div className="mt-4 rounded-2xl bg-[rgba(195,35,83,0.08)] ring-1 ring-[var(--logo-red)]/20 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-gray-800">{createLabel}</p>
          <button type="button" className="btn btn-primary shrink-0" onClick={() => openForm("create")}>
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
              {isEdit ? "Modifier votre avis" : "Votre avis compte"}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {isEdit
                ? "Vous pouvez mettre à jour votre message, votre note ou votre photo. Votre avis peut être modifié avant publication."
                : formHint}
            </p>

            {error ? (
              <p className="mt-3 text-sm text-red-700 rounded-xl bg-red-50 px-3 py-2 ring-1 ring-red-200">{error}</p>
            ) : null}

            <div className="mt-5 grid gap-4">
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-gray-800">Nom affiché *</span>
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
                <span className="font-medium text-gray-800">Message * (min. 20 caractères)</span>
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
                <span className="font-medium text-gray-800">Photo (optionnel, JPG/PNG, max 1 Mo)</span>
                {existingPhoto && !photoDataUrl && !removePhoto ? (
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-14 overflow-hidden rounded-lg ring-1 ring-black/10">
                      <Image src={existingPhoto} alt="" fill className="object-cover" sizes="56px" unoptimized />
                    </div>
                    <button
                      type="button"
                      className="text-sm text-red-700 underline"
                      onClick={() => setRemovePhoto(true)}
                    >
                      Supprimer la photo
                    </button>
                  </div>
                ) : null}
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
                    if (file.size > 1 * 1024 * 1024) {
                      setError("La photo doit faire au plus 1 Mo.");
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
                    setRemovePhoto(false);
                    setError(null);
                  }}
                />
              </label>
            </div>

            <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button type="button" className="btn btn-ghost" onClick={closeDismiss} disabled={loading}>
                Annuler
              </button>
              <button type="button" className="btn btn-dark" onClick={() => void submit()} disabled={loading}>
                {loading ? "Envoi…" : isEdit ? "Enregistrer" : "Envoyer mon avis"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
