"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Reveal } from "@/app/site/components/Reveal";
import { Select, TextArea, TextInput } from "@/app/site/components/Form";
import { PageHeader } from "@/app/site/components/UI";

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

export default function ExpedierUnColisPage() {
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
      if (data.warning) {
        setSuccess(data.warning);
      } else {
        setSuccess(`Demande ${modeLabel} envoyée.`);
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
            {success ? (
              <p className="text-sm text-emerald-800 rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
                {success}
              </p>
            ) : null}

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
                <TextInput label="Nom complet de l’expéditeur (recommandé)" placeholder="Emile James" value={senderName} onChange={(e) => setSenderName(e.target.value)} />
                <TextInput label="Numéro de l’expéditeur *" placeholder="+33 152629176" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} />
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
                <TextInput label="Numéro du destinataire *" placeholder="+229 61 00 00 00" value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} />
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

