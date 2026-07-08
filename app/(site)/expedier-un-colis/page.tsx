"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Reveal } from "@/app/site/components/Reveal";
import { Select, TextArea, TextInput } from "@/app/site/components/Form";
import { PhoneInput } from "@/app/site/components/PhoneInput";
import { PageHeader } from "@/app/site/components/UI";
import { ensurePhoneWithDial } from "@/lib/phone-country";

function readProfileString(p: Record<string, unknown> | null | undefined, key: string): string {
  const v = p?.[key];
  return typeof v === "string" ? v : "";
}

function displayNameFromMe(
  me: { name?: string | null; profile?: Record<string, unknown> | null } | null,
  fallbackName: string,
): string {
  if (me?.name?.trim()) return me.name.trim();
  const fromProf = `${readProfileString(me?.profile, "firstName")} ${readProfileString(me?.profile, "lastName")}`.trim();
  return fromProf || fallbackName.trim();
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white/80 ring-1 ring-black/[0.06] p-5 md:p-6 shadow-sm shadow-black/[0.02]">
      <h2 className="text-xs font-semibold tracking-wide text-gray-700 uppercase border-b border-black/5 pb-3 mb-5">{title}</h2>
      <div className="grid gap-4 md:gap-5">{children}</div>
    </section>
  );
}

type Mode = "AIR" | "SEA";

async function compressImageToJpegDataUrl(file: File, maxDim = 520, quality = 0.72): Promise<string> {
  // EmailJS limite la taille des variables : on réduit l'image avant de l'encoder en base64.
  // On renvoie toujours du JPEG pour maximiser la réduction.
  return new Promise<string>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        if (!w || !h) throw new Error("IMAGE_DIMENSIONS_MISSING");

        const scale = Math.min(1, maxDim / Math.max(w, h));
        const outW = Math.max(1, Math.round(w * scale));
        const outH = Math.max(1, Math.round(h * scale));

        const canvas = document.createElement("canvas");
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("CANVAS_CONTEXT_MISSING");

        ctx.drawImage(img, 0, 0, outW, outH);
        const out = canvas.toDataURL("image/jpeg", quality);
        resolve(out);
      } catch (e) {
        reject(e);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("IMAGE_LOAD_ERROR"));
    };
    img.src = url;
  });
}

export default function ExpedierUnColisPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didPrefill = useRef(false);

  const [mode, setMode] = useState<Mode>("AIR");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [contactEmail, setContactEmail] = useState("");
  const [trackingNumber, setTrackingNumber] = useState<string>("");
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [destinationCountry, setDestinationCountry] = useState("Bénin");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [weightKg, setWeightKg] = useState<string>("");
  const [notes, setNotes] = useState("");

  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);

  const isClient = session?.user?.role === "client";

  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || didPrefill.current) return;
    didPrefill.current = true;

    void (async () => {
      let email = session?.user?.email ?? "";
      let name = session?.user?.name ?? "";
      let phone = "";

      try {
        const res = await fetch("/api/me");
        if (res.ok) {
          const me = (await res.json()) as {
            email?: string;
            name?: string | null;
            profile?: Record<string, unknown> | null;
          };
          email = me.email ?? email;
          name = displayNameFromMe(me, name);
          phone = ensurePhoneWithDial(
            readProfileString(me.profile, "phone"),
            readProfileString(me.profile, "country") || "France",
          );
        }
      } catch {
        // session fallback
      }

      setContactEmail(email);
      setSenderName(name);
      setSenderPhone(phone);
    })();
  }, [status, session]);

  const canSubmit = useMemo(() => {
    if (!photoDataUrl) return false;
    if (!pickupAddress.trim()) return false;
    if (!destinationAddress.trim()) return false;
    if (!senderPhone.trim()) return false;
    if (!recipientPhone.trim()) return false;
    if (!recipientName.trim()) return false;
    return true;
  }, [photoDataUrl, pickupAddress, destinationAddress, senderPhone, recipientPhone, recipientName]);

  async function onSubmit() {
    setError(null);
    setSuccess(null);

    if (!photoDataUrl) {
      setError("Photo obligatoire pour valider votre demande d’expédition.");
      return;
    }
    if (!pickupAddress.trim()) {
      setError("Adresse complète de récupération obligatoire.");
      return;
    }
    if (!destinationAddress.trim()) {
      setError("Adresse complète de destination obligatoire.");
      return;
    }
    if (!senderPhone.trim()) {
      setError("Téléphone expéditeur obligatoire.");
      return;
    }
    if (!recipientPhone.trim()) {
      setError("Téléphone destinataire obligatoire.");
      return;
    }
    if (!recipientName.trim()) {
      setError("Nom complet du destinataire obligatoire.");
      return;
    }

    const modeLabel = mode === "SEA" ? "maritime" : "aérienne";

    setLoading(true);
    try {
      // Un seul endpoint backend (toujours présent) : le mode est dans le corps (`transportMode`).
      const res = await fetch("/api/shipping-requests/maritime", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transportMode: mode,
          contactEmail: contactEmail.trim() || undefined,
          trackingNumber: trackingNumber.trim() || undefined,
          senderName,
          senderPhone,
          pickupAddress,
          recipientName,
          recipientPhone,
          destinationCountry,
          destinationAddress,
          weightKg: weightKg ? Number(weightKg) : undefined,
          notes,
          photoDataUrl,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      const data = (await res.json()) as {
        ok?: boolean;
        emailed?: boolean;
        warning?: string;
      };
      const flashMsg = data.warning ?? `Demande ${modeLabel} envoyée avec succès.`;
      setSuccess(flashMsg);
      if (isClient) {
        sessionStorage.setItem("expedition_flash", flashMsg);
        redirectTimer.current = setTimeout(() => {
          router.push("/mes-expeditions");
        }, 1500);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Impossible d’envoyer la demande ${modeLabel}. Détail: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="site-container site-section">
      <Reveal>
        <PageHeader
          eyebrow="Expédition"
          title="Expédition de colis"
          subtitle="Vous avez un colis à envoyer ? Choisissez votre type de transport (aérien ou maritime), entrez les détails du colis et nous nous occupons du reste."
        />
      </Reveal>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)] lg:items-start">
        <Reveal>
          <form className="rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-sm p-6 md:p-8 flex flex-col gap-8">
            {error ? <p className="text-sm text-red-700 rounded-xl bg-red-50 px-4 py-3 ring-1 ring-red-200">{error}</p> : null}

            <FormSection title="Mode de transport">
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className={
                    mode === "AIR"
                      ? "rounded-2xl bg-[var(--logo-red)] text-white px-5 py-4 text-sm font-semibold shadow-lg shadow-[var(--logo-red)]/20 transition-smooth hover:bg-[var(--logo-red-dark)]"
                      : "rounded-2xl bg-white/80 ring-1 ring-black/10 px-5 py-4 text-sm font-semibold text-gray-900 transition-smooth hover:bg-white"
                  }
                  onClick={() => setMode("AIR")}
                >
                  Aérien
                </button>
                <button
                  type="button"
                  className={
                    mode === "SEA"
                      ? "rounded-2xl bg-[var(--logo-red)] text-white px-5 py-4 text-sm font-semibold shadow-lg shadow-[var(--logo-red)]/20 transition-smooth hover:bg-[var(--logo-red-dark)]"
                      : "rounded-2xl bg-white/80 ring-1 ring-black/10 px-5 py-4 text-sm font-semibold text-gray-900 transition-smooth hover:bg-white"
                  }
                  onClick={() => setMode("SEA")}
                >
                  Maritime
                </button>
              </div>
              <p className="text-sm text-gray-600 -mt-1">
                {mode === "AIR"
                  ? "Transport rapide : idéal pour petits colis et délais serrés."
                  : "Transport économique : adapté aux gros volumes et envois moins urgents."}
              </p>
            </FormSection>

            <FormSection title="Contact & expéditeur">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput
                  className="sm:col-span-2"
                  label="Email (pour vous recontacter)"
                  type="email"
                  placeholder="emilejames@gmail.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  autoComplete="email"
                />
                <TextInput
                  label="Nom complet de l’expéditeur (recommandé)"
                  placeholder="Emile James"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                />
                <PhoneInput
                  label="Numéro de l’expéditeur *"
                  value={senderPhone}
                  onChange={setSenderPhone}
                  country="France"
                  required
                />
              </div>
            </FormSection>

            <FormSection title="Prise en charge">
              <div className="grid gap-4 sm:max-w-md">
                <Select label="Pays de départ" defaultValue="France">
                  <option>France</option>
                  <option>Belgique</option>
                </Select>
                <TextInput
                  label="Adresse complète de récupération *"
                  placeholder="N° + rue, ville, code postal, pays"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                />
              </div>
            </FormSection>

            <FormSection title="Destinataire & livraison">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label="Nom complet du destinataire *" placeholder="Nadège Akpovi" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
                <PhoneInput
                  label="Numéro du destinataire *"
                  value={recipientPhone}
                  onChange={setRecipientPhone}
                  country={destinationCountry}
                  required
                />
              </div>
              <div className="grid gap-4 sm:max-w-md">
                <Select label="Pays de destination" defaultValue={destinationCountry} onChange={(e) => setDestinationCountry(e.target.value)}>
                  <option>Bénin</option>
                  <option>Togo</option>
                  <option>Sénégal</option>
                  <option>Côte d’Ivoire</option>
                </Select>
                <TextInput
                  label="Adresse complète de destination *"
                  placeholder="N° + rue, ville, repère/quartier, pays"
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                />
              </div>
            </FormSection>

            <FormSection title="Détails du colis">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput
                  label="Poids approx (kg) (optionnel)"
                  placeholder="5"
                  inputMode="decimal"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                />
                <TextInput
                  label="Numéro de suivi (recommandé)"
                  placeholder="Ex: 1Z999AA10123456784"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
                <TextInput label="Dimensions (cm)" placeholder="35x25x15" />
                <TextInput label="Valeur estimée (€)" placeholder="610" inputMode="decimal" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextArea
                  className="sm:col-span-2"
                  label="Contenu du colis"
                  placeholder="Ex: 1 smartphone, 2 chemises, 1 parfum…"
                />
                <TextArea
                  className="sm:col-span-2"
                  label="Instructions particulières (recommandé)"
                  placeholder="Ex: manipuler avec précaution, destinataire dispo après 18h…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </FormSection>

            <FormSection title="Photo du colis *">
              <p className="text-sm text-gray-600 -mt-1 mb-1">
                JPG ou PNG, max 5&nbsp;Mo. Obligatoire pour valider la demande (aérien et maritime).
              </p>
              <input
                type="file"
                accept="image/jpeg,image/png"
                className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-xl file:border-0 file:bg-[rgba(195,35,83,0.12)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[var(--logo-red-dark)]"
                aria-label="Photo du colis"
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
                  // Compression légère pour éviter l'échec EmailJS (limite variables).
                  let dataUrl: string | null = null;
                  try {
                    dataUrl = await compressImageToJpegDataUrl(file);
                  } catch {
                    // Fallback : encodage brut si compression impossible.
                    dataUrl = await new Promise<string>((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onload = () => resolve(String(reader.result || ""));
                      reader.onerror = () => reject(new Error("READ_ERROR"));
                      reader.readAsDataURL(file);
                    }).catch(() => "");
                  }
                  setPhotoDataUrl(dataUrl || null);
                  setError(null);
                }}
              />
              {photoDataUrl ? (
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoDataUrl} alt="Aperçu du colis" className="h-40 w-full max-w-xs rounded-xl object-cover ring-1 ring-black/10 bg-gray-50" />
                  <p className="text-xs font-semibold text-emerald-800 self-center sm:self-start sm:pt-2">Photo OK — prête à l’envoi</p>
                </div>
              ) : (
                <p className="text-xs font-semibold text-red-700">Photo requise pour valider</p>
              )}
            </FormSection>

            <div className="pt-2 border-t border-black/5">
              <button
                type="button"
                disabled={!canSubmit || loading}
                className="btn btn-dark w-full sm:w-auto sm:min-w-[220px] disabled:opacity-70 disabled:pointer-events-none"
                onClick={onSubmit}
              >
                {loading ? "Envoi..." : "Envoyer la demande"}
              </button>

              {success ? (
                <div className="mt-3 text-sm text-emerald-800 rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
                  <p>{success}</p>
                  {isClient ? (
                    <p className="mt-2 text-emerald-700">Redirection vers Mes expéditions…</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </form>
        </Reveal>

        <Reveal delayMs={120}>
          <div className="lg:sticky lg:top-24 rounded-3xl bg-gradient-to-br from-white/85 to-white/55 ring-1 ring-black/5 shadow-xl shadow-gray-200/40 p-6 md:p-7">
            <h2 className="text-sm font-semibold text-gray-900">À retenir</h2>
            <ul className="mt-3 grid gap-2 text-sm text-gray-600 leading-relaxed list-disc pl-5">
              <li>Choisissez Aérien pour un délai plus rapide.</li>
              <li>Maritime est souvent plus économique pour les colis volumineux.</li>
              <li>Indiquez une valeur estimée réaliste (assurance / douane).</li>
            </ul>
            <div className="mt-6 rounded-2xl bg-white/80 ring-1 ring-black/5 p-5">
              <p className="text-xs font-semibold tracking-wide text-gray-600 uppercase">Support</p>
              <p className="mt-2 text-sm text-gray-700">
                Besoin d’aide pour estimer poids/volume ou choisir un mode ? Contactez le support.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </main>
  );
}

