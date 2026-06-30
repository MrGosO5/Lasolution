"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Reveal } from "@/app/site/components/Reveal";
import { Select, TextArea, TextInput, Toggle } from "@/app/site/components/Form";
import { PageHeader } from "@/app/site/components/UI";

type StepId = "personal" | "documents" | "experience" | "confirm";

const DOC_FIELDS = [
  { key: "identity" as const, t: "Passeport ou pièce d'identité", s: "Document d'identité en cours de validité", required: true },
  { key: "photo" as const, t: "Photo récente", s: "Portrait de moins de 6 mois, fond uni", required: true },
  { key: "proof" as const, t: "Justificatif de domicile", s: "Moins de 3 mois (facture eau/électricité/gaz, etc.)", required: false },
];

type ApplicationDocuments = Partial<Record<"identity" | "photo" | "proof", string>>;

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("READ_ERROR"));
    reader.readAsDataURL(file);
  });
}

const STEPS: { id: StepId; label: string }[] = [
  { id: "personal",   label: "Informations personnelles" },
  { id: "documents",  label: "Documents requis" },
  { id: "experience", label: "Expérience et motivation" },
  { id: "confirm",    label: "Confirmation" },
];

type SolupackerForm = {
  lastName: string;
  firstName: string;
  dob: string;
  nationality: string;
  phone: string;
  email: string;
  address: string;
  whatsapp: string;
  hasDeliveryExperience: boolean;
  hasFlownBefore: boolean;
  canCarryExtraWeight: boolean;
  acceptsLiability: boolean;
  motivation: string;
};

const initialForm: SolupackerForm = {
  lastName: "",
  firstName: "",
  dob: "",
  nationality: "France",
  phone: "",
  email: "",
  address: "",
  whatsapp: "",
  hasDeliveryExperience: false,
  hasFlownBefore: true,
  canCarryExtraWeight: true,
  acceptsLiability: true,
  motivation: "",
};

export default function DevenirSolupackerPage() {
  const [step, setStep] = useState<StepId>("personal");
  const [form, setForm] = useState<SolupackerForm>(initialForm);
  const [documents, setDocuments] = useState<ApplicationDocuments>({});
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currentIdx = useMemo(() => STEPS.findIndex((s) => s.id === step), [step]);
  const canPrev = currentIdx > 0;
  const canNext = currentIdx < STEPS.length - 1;

  function validateStep(stepId: StepId): boolean {
    const errors: Record<string, string> = {};
    if (stepId === "personal") {
      if (!form.lastName.trim()) errors.lastName = "Nom requis";
      if (!form.firstName.trim()) errors.firstName = "Prénom requis";
      if (!form.email.trim() || !isValidEmail(form.email)) errors.email = "Email valide requis";
      if (!form.phone.trim()) errors.phone = "Téléphone requis";
    }
    if (stepId === "documents") {
      if (!documents.identity) errors.identity = "Pièce d'identité requise";
      if (!documents.photo) errors.photo = "Photo requise";
    }
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function goPrev() { if (canPrev) setStep(STEPS[currentIdx - 1]!.id); }
  function goNext() {
    if (!canNext) return;
    if (!validateStep(step)) return;
    setStep(STEPS[currentIdx + 1]!.id);
  }
  function patch<K extends keyof SolupackerForm>(key: K, value: SolupackerForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleDocumentUpload(key: keyof ApplicationDocuments, file: File | undefined) {
    if (!file) {
      setDocuments((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setStepErrors((prev) => ({ ...prev, [key]: "Fichier trop volumineux (max 5 Mo)." }));
      return;
    }
    if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
      setStepErrors((prev) => ({ ...prev, [key]: "Format accepté : JPG, PNG ou PDF." }));
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setDocuments((prev) => ({ ...prev, [key]: dataUrl }));
      setStepErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch {
      setStepErrors((prev) => ({ ...prev, [key]: "Lecture du fichier impossible." }));
    }
  }

  async function submitApplication() {
    if (!validateStep("personal") || !validateStep("documents")) {
      setSubmitError("Veuillez compléter les champs et documents obligatoires.");
      return;
    }
    setSubmitStatus("loading");
    setSubmitError(null);
    try {
      const res = await fetch("/api/solupacker-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, documents }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setSubmitStatus("error");
        setSubmitError(data.error || "Envoi impossible.");
        return;
      }
      setSubmitStatus("success");
    } catch {
      setSubmitStatus("error");
      setSubmitError("Réseau indisponible.");
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-14 md:py-16">
      <Reveal>
        <PageHeader
          eyebrow="SoluPacker"
          title="Devenir SoluPacker"
          subtitle="Transportez des colis lors de vos voyages entre l'Europe et l'Afrique et gagnez des commissions."
          right={
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-gray-900 bg-white/75 ring-1 ring-black/5 shadow-sm transition-smooth hover:bg-white"
            >
              Retour
            </Link>
          }
        />
      </Reveal>

      <Reveal delayMs={120}>
        <div className="mt-10 rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-sm p-6 md:p-7">
          {submitStatus === "success" ? (
            <div className="rounded-2xl bg-emerald-50 ring-1 ring-emerald-200 p-6 md:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M5 12l5 5L20 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-base font-semibold text-emerald-900">Demande envoyée avec succès !</p>
              </div>
              <p className="mt-3 text-sm text-emerald-800 leading-relaxed">
                Nous avons bien reçu votre dossier SoluPacker. Notre équipe l'examinera dans les plus brefs délais et
                vous contactera par email pour la suite du processus.
              </p>
              <Link
                href="/"
                className="mt-5 inline-flex items-center justify-center rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-950 transition-smooth"
              >
                Retour à l'accueil
              </Link>
            </div>
          ) : (
            <>
              {/* Step indicator */}
              <div className="flex flex-wrap gap-2 mb-8">
                {STEPS.map((s, idx) => {
                  const active = s.id === step;
                  const done = idx < currentIdx;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStep(s.id)}
                      className={[
                        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-smooth",
                        active
                          ? "bg-[var(--logo-red)] text-white shadow-lg shadow-[var(--logo-red)]/20"
                          : done
                          ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
                          : "bg-white/70 text-gray-800 ring-1 ring-black/5 hover:bg-white",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold",
                          active ? "bg-white/20" : done ? "bg-emerald-500 text-white" : "bg-black/5",
                        ].join(" ")}
                      >
                        {done ? "✓" : idx + 1}
                      </span>
                      {s.label}
                    </button>
                  );
                })}
              </div>

              {/* Step content */}
              <div className="mt-2">
                {step === "personal" && (
                  <section className="grid gap-5">
                    <h2 className="text-base font-semibold text-gray-900">Informations personnelles</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextInput
                        label="Nom"
                        placeholder="Dupont"
                        value={form.lastName}
                        onChange={(e) => patch("lastName", e.target.value)}
                        required
                      />
                      {stepErrors.lastName ? <p className="text-xs text-red-600 -mt-3">{stepErrors.lastName}</p> : null}
                      <TextInput
                        label="Prénom"
                        placeholder="Marie"
                        value={form.firstName}
                        onChange={(e) => patch("firstName", e.target.value)}
                        required
                      />
                      {stepErrors.firstName ? <p className="text-xs text-red-600 -mt-3">{stepErrors.firstName}</p> : null}
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextInput
                        label="Date de naissance"
                        placeholder="JJ/MM/AAAA"
                        value={form.dob}
                        onChange={(e) => patch("dob", e.target.value)}
                      />
                      <Select
                        label="Nationalité"
                        value={form.nationality}
                        onChange={(e) => patch("nationality", e.target.value)}
                      >
                        <option>France</option>
                        <option>Belgique</option>
                        <option>Suisse</option>
                        <option>Bénin</option>
                        <option>Togo</option>
                        <option>Sénégal</option>
                        <option>Côte d'Ivoire</option>
                        <option>Cameroun</option>
                        <option>Mali</option>
                        <option>Ghana</option>
                        <option>Autre</option>
                      </Select>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextInput
                        label="Numéro de téléphone"
                        placeholder="+33 6 12 34 56 78"
                        value={form.phone}
                        onChange={(e) => patch("phone", e.target.value)}
                        required
                      />
                      {stepErrors.phone ? <p className="text-xs text-red-600 -mt-3">{stepErrors.phone}</p> : null}
                      <TextInput
                        label="Email"
                        type="email"
                        placeholder="marie.dupont@email.com"
                        value={form.email}
                        onChange={(e) => patch("email", e.target.value)}
                        required
                      />
                      {stepErrors.email ? <p className="text-xs text-red-600 -mt-3">{stepErrors.email}</p> : null}
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextInput
                        label="Adresse"
                        placeholder="12 rue de la Paix, Paris"
                        value={form.address}
                        onChange={(e) => patch("address", e.target.value)}
                      />
                      <TextInput
                        label="WhatsApp (facultatif)"
                        placeholder="+33 6 12 34 56 78"
                        value={form.whatsapp}
                        onChange={(e) => patch("whatsapp", e.target.value)}
                      />
                    </div>
                  </section>
                )}

                {step === "documents" && (
                  <section className="grid gap-5">
                    <div>
                      <h2 className="text-base font-semibold text-gray-900">Documents requis</h2>
                      <p className="mt-1 text-sm text-gray-600">
                        JPG, PNG ou PDF — 5 Mo maximum par fichier.
                      </p>
                    </div>
                    <div className="grid gap-3">
                      {DOC_FIELDS.map((d) => (
                        <div
                          key={d.key}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl bg-white/80 ring-1 ring-black/5 p-5"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {d.t}
                              {d.required && <span className="ml-1 text-[var(--logo-red)]">*</span>}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500">{d.s}</p>
                            {documents[d.key]?.startsWith("data:image") ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={documents[d.key]}
                                alt={`Aperçu ${d.t}`}
                                className="mt-2 h-24 w-auto max-w-[200px] rounded-lg object-cover ring-1 ring-black/10"
                              />
                            ) : documents[d.key] ? (
                              <p className="mt-2 text-xs font-semibold text-emerald-700">Fichier chargé (PDF)</p>
                            ) : null}
                            {stepErrors[d.key] ? (
                              <p className="mt-1 text-xs text-red-600">{stepErrors[d.key]}</p>
                            ) : documents[d.key] ? (
                              <p className="mt-1 text-xs text-emerald-700">Document OK</p>
                            ) : null}
                          </div>
                          <label className="inline-flex items-center gap-2 justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/15 transition-smooth hover:bg-black cursor-pointer">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Téléverser
                            <input
                              type="file"
                              accept="image/jpeg,image/png,application/pdf"
                              className="sr-only"
                              onChange={(e) => void handleDocumentUpload(d.key, e.target.files?.[0])}
                            />
                          </label>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">* Obligatoire avant soumission.</p>
                  </section>
                )}

                {step === "experience" && (
                  <section className="grid gap-5">
                    <h2 className="text-base font-semibold text-gray-900">Expérience et motivation</h2>
                    <div className="grid gap-3">
                      <Toggle
                        label="Avez-vous déjà effectué des livraisons ou transporté des colis pour autrui ?"
                        value={form.hasDeliveryExperience}
                        onChange={(v) => patch("hasDeliveryExperience", v)}
                      />
                      <Toggle
                        label="Voyagez-vous régulièrement entre la France et l'Afrique ?"
                        value={form.hasFlownBefore}
                        onChange={(v) => patch("hasFlownBefore", v)}
                      />
                      <Toggle
                        label="Êtes-vous en mesure de transporter un poids supplémentaire en soute ?"
                        value={form.canCarryExtraWeight}
                        onChange={(v) => patch("canCarryExtraWeight", v)}
                      />
                      <Toggle
                        label="Acceptez-vous d'être responsable des colis confiés jusqu'à leur remise ?"
                        value={form.acceptsLiability}
                        onChange={(v) => patch("acceptsLiability", v)}
                      />
                    </div>
                    <TextArea
                      label="Pourquoi souhaitez-vous devenir SoluPacker ?"
                      placeholder="Partagez votre motivation, votre fréquence de voyage, vos destinations habituelles…"
                      value={form.motivation}
                      onChange={(e) => patch("motivation", e.target.value)}
                    />
                  </section>
                )}

                {step === "confirm" && (
                  <section className="grid gap-5">
                    <h2 className="text-base font-semibold text-gray-900">Confirmation de demande</h2>

                    {/* Recap */}
                    <div className="rounded-2xl bg-white/80 ring-1 ring-black/5 p-5 grid gap-3">
                      <p className="text-sm font-semibold text-gray-900">Récapitulatif</p>
                      <div className="grid gap-2 text-sm">
                        {[
                          ["Nom complet", `${form.firstName} ${form.lastName}`.trim() || "—"],
                          ["Email", form.email || "—"],
                          ["Téléphone", form.phone || "—"],
                          ["Nationalité", form.nationality || "—"],
                          ["Expérience livraison", form.hasDeliveryExperience ? "Oui" : "Non"],
                          ["Voyages réguliers", form.hasFlownBefore ? "Oui" : "Non"],
                        ].map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between gap-4 py-1.5 border-b border-black/5 last:border-0">
                            <span className="text-gray-500">{k}</span>
                            <span className="font-medium text-gray-900">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Contract upload stub */}
                    <div className="rounded-2xl bg-white/80 ring-1 ring-black/5 p-5">
                      <p className="text-sm font-semibold text-gray-900">Contrat de collaboration</p>
                      <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                        Un contrat de collaboration vous sera envoyé après examen de votre dossier.
                        Vous pourrez le signer et le renvoyer numériquement.
                      </p>
                      <button
                        type="button"
                        disabled
                        className="mt-3 inline-flex items-center gap-2 justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white opacity-50 cursor-not-allowed"
                      >
                        Téléverser le contrat signé (PDF) — bientôt
                      </button>
                    </div>

                    {submitError && (
                      <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 ring-1 ring-red-200">{submitError}</p>
                    )}

                    <button
                      type="button"
                      disabled={submitStatus === "loading"}
                      onClick={submitApplication}
                      className="inline-flex items-center justify-center rounded-xl bg-[var(--logo-red)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--logo-red)]/20 transition-smooth hover:bg-[var(--logo-red-dark)] disabled:opacity-60"
                    >
                      {submitStatus === "loading" ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Envoi en cours…
                        </>
                      ) : (
                        "Confirmer ma demande"
                      )}
                    </button>

                    <div className="rounded-2xl bg-white/60 ring-1 ring-black/5 p-5">
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Confidentialité</p>
                      <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                        Vos informations sont utilisées uniquement pour traiter votre demande de partenariat. Elles sont
                        sécurisées et ne seront jamais revendues à des tiers.
                      </p>
                    </div>
                  </section>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="mt-10 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={!canPrev}
                  className={[
                    "inline-flex items-center gap-2 justify-center rounded-xl px-5 py-3 text-sm font-semibold transition-smooth",
                    canPrev
                      ? "bg-white/80 text-gray-900 ring-1 ring-black/5 hover:bg-white shadow-sm"
                      : "bg-black/5 text-gray-400 cursor-not-allowed",
                  ].join(" ")}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Précédent
                </button>
                {canNext && (
                  <button
                    type="button"
                    onClick={goNext}
                    className="inline-flex items-center gap-2 justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white bg-[var(--logo-red)] shadow-lg shadow-[var(--logo-red)]/20 transition-smooth hover:bg-[var(--logo-red-dark)]"
                  >
                    Continuer
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </Reveal>
    </main>
  );
}
