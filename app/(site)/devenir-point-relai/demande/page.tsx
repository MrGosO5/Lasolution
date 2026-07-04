"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Reveal } from "@/app/site/components/Reveal";
import { Select, TextArea, TextInput, Toggle } from "@/app/site/components/Form";
import { PhoneInput } from "@/app/site/components/PhoneInput";
import { PageHeader } from "@/app/site/components/UI";

type StepId = "personal" | "relay" | "docs" | "confirm";

const RELAY_DOC_FIELDS = [
  { key: "identity" as const, t: "Pièce d'identité du responsable", s: "scan ou image", required: true },
  { key: "shopFront" as const, t: "Photo de la boutique", s: "scan ou image", required: true },
  { key: "storage" as const, t: "Photo de l'espace de stockage", s: "scan ou image", required: false },
  { key: "proof" as const, t: "Justificatif d'adresse (optionnel)", s: "scan ou image", required: false },
];

type RelayDocuments = Partial<Record<"identity" | "shopFront" | "storage" | "proof", string>>;

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
  { id: "personal", label: "Informations personnelles" },
  { id: "relay", label: "Informations du point relais" },
  { id: "docs", label: "Documents requis" },
  { id: "confirm", label: "Confirmation" },
];

type RelayForm = {
  lastName: string;
  firstName: string;
  dob: string;
  nationality: string;
  phone: string;
  email: string;
  address: string;
  whatsapp: string;
  relayName: string;
  relayAddress: string;
  openTime: string;
  closeTime: string;
  volume: string;
  maxParcels: string;
  motivation: string;
  hasStorageSpace: boolean;
  acceptBulky: boolean;
  acceptRules: boolean;
  hasValidId: boolean;
};

const initialForm: RelayForm = {
  lastName: "",
  firstName: "",
  dob: "",
  nationality: "France",
  phone: "",
  email: "",
  address: "",
  whatsapp: "",
  relayName: "",
  relayAddress: "",
  openTime: "",
  closeTime: "",
  volume: "",
  maxParcels: "",
  motivation: "",
  hasStorageSpace: true,
  acceptBulky: true,
  acceptRules: true,
  hasValidId: true,
};

export default function DemandePointRelaiPage() {
  const [step, setStep] = useState<StepId>("personal");
  const [form, setForm] = useState<RelayForm>(initialForm);
  const [documents, setDocuments] = useState<RelayDocuments>({});
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
    if (stepId === "relay") {
      if (!form.relayName.trim()) errors.relayName = "Nom du point relais requis";
      if (!form.relayAddress.trim()) errors.relayAddress = "Adresse requise";
    }
    if (stepId === "docs") {
      if (!documents.identity) errors.identity = "Pièce d'identité requise";
      if (!documents.shopFront) errors.shopFront = "Photo de la boutique requise";
    }
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function goPrev() {
    if (!canPrev) return;
    setStep(STEPS[currentIdx - 1]!.id);
  }
  function goNext() {
    if (!canNext) return;
    if (!validateStep(step)) return;
    setStep(STEPS[currentIdx + 1]!.id);
  }

  function patch<K extends keyof RelayForm>(key: K, value: RelayForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleDocumentUpload(key: keyof RelayDocuments, file: File | undefined) {
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
    if (!validateStep("personal") || !validateStep("relay") || !validateStep("docs")) {
      setSubmitError("Veuillez compléter les champs et documents obligatoires.");
      return;
    }
    setSubmitStatus("loading");
    setSubmitError(null);
    try {
      const res = await fetch("/api/partner-relay-application", {
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
          eyebrow="Partenaires"
          title="Demande Point Relai"
          subtitle="Merci de compléter le formulaire pour soumettre votre demande. Veuillez fournir vos vraies informations — elles seront nécessaires pour valider votre statut."
          right={
            <Link
              href="/devenir-point-relai"
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
            <div className="rounded-2xl bg-emerald-50 ring-1 ring-emerald-200 p-6">
              <p className="text-sm font-semibold text-emerald-900">Demande enregistrée</p>
              <p className="mt-2 text-sm text-emerald-800 leading-relaxed">
                Nous avons bien reçu votre dossier. L'équipe reviendra vers vous par email une fois votre candidature examinée.
              </p>
              <Link
                href="/devenir-point-relai"
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-950"
              >
                Retour à la présentation
              </Link>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
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
                          : "bg-white/70 text-gray-800 ring-1 ring-black/5 hover:bg-white",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px]",
                          active ? "bg-white/20" : "bg-black/5",
                        ].join(" ")}
                      >
                        {done ? "✓" : idx + 1}
                      </span>
                      {s.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-8">
                {step === "personal" ? (
                  <section className="grid gap-4">
                    <h2 className="text-sm font-semibold text-gray-900">Informations personnelles</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <TextInput label="Nom" placeholder="James" value={form.lastName} onChange={(e) => patch("lastName", e.target.value)} required />
                        {stepErrors.lastName ? <p className="text-xs text-red-600 mt-1">{stepErrors.lastName}</p> : null}
                      </div>
                      <div>
                        <TextInput label="Prénom" placeholder="Emile" value={form.firstName} onChange={(e) => patch("firstName", e.target.value)} required />
                        {stepErrors.firstName ? <p className="text-xs text-red-600 mt-1">{stepErrors.firstName}</p> : null}
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextInput label="Date de naissance" placeholder="11/06/1995" value={form.dob} onChange={(e) => patch("dob", e.target.value)} />
                      <Select label="Nationalité" value={form.nationality} onChange={(e) => patch("nationality", e.target.value)}>
                        <option>France</option>
                        <option>Bénin</option>
                        <option>Togo</option>
                        <option>Sénégal</option>
                        <option>Côte d'Ivoire</option>
                      </Select>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <PhoneInput
                          label="Numéro de téléphone"
                          value={form.phone}
                          onChange={(v) => patch("phone", v)}
                          country={form.nationality}
                          required
                        />
                        {stepErrors.phone ? <p className="text-xs text-red-600 mt-1">{stepErrors.phone}</p> : null}
                      </div>
                      <div>
                        <TextInput label="Email" type="email" placeholder="emilejames@gmail.com" value={form.email} onChange={(e) => patch("email", e.target.value)} required />
                        {stepErrors.email ? <p className="text-xs text-red-600 mt-1">{stepErrors.email}</p> : null}
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextInput label="Adresse" placeholder="France, Paris" value={form.address} onChange={(e) => patch("address", e.target.value)} />
                      <PhoneInput
                        label="WhatsApp (facultatif)"
                        value={form.whatsapp}
                        onChange={(v) => patch("whatsapp", v)}
                        country={form.nationality}
                      />
                    </div>
                  </section>
                ) : null}

                {step === "relay" ? (
                  <section className="grid gap-4">
                    <h2 className="text-sm font-semibold text-gray-900">Informations du point relais</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <TextInput label="Nom du point relai" placeholder="Nom du point relais" value={form.relayName} onChange={(e) => patch("relayName", e.target.value)} required />
                        {stepErrors.relayName ? <p className="text-xs text-red-600 mt-1">{stepErrors.relayName}</p> : null}
                      </div>
                      <div>
                        <TextInput label="Adresse complète" placeholder="Rue, ville, pays" value={form.relayAddress} onChange={(e) => patch("relayAddress", e.target.value)} required />
                        {stepErrors.relayAddress ? <p className="text-xs text-red-600 mt-1">{stepErrors.relayAddress}</p> : null}
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextInput label="Ouverture" placeholder="08:00" value={form.openTime} onChange={(e) => patch("openTime", e.target.value)} />
                      <TextInput label="Fermeture" placeholder="22:00" value={form.closeTime} onChange={(e) => patch("closeTime", e.target.value)} />
                    </div>
                    <Toggle label="Avez-vous un espace dédié pour stocker des colis ?" value={form.hasStorageSpace} onChange={(v) => patch("hasStorageSpace", v)} />
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextInput label="Volume approximatif (m³)" placeholder="3" value={form.volume} onChange={(e) => patch("volume", e.target.value)} />
                      <TextInput label="Nombre maximal de colis" placeholder="25" value={form.maxParcels} onChange={(e) => patch("maxParcels", e.target.value)} />
                    </div>
                    <div className="grid gap-3">
                      <Toggle label="Acceptez-vous de recevoir des colis volumineux ?" value={form.acceptBulky} onChange={(v) => patch("acceptBulky", v)} />
                      <Toggle label="Acceptez-vous de respecter les règles de sécurité et de conditionnement ?" value={form.acceptRules} onChange={(v) => patch("acceptRules", v)} />
                      <Toggle label="Avez-vous une pièce d'identité valide ?" value={form.hasValidId} onChange={(v) => patch("hasValidId", v)} />
                    </div>
                  </section>
                ) : null}

                {step === "docs" ? (
                  <section className="grid gap-4">
                    <h2 className="text-sm font-semibold text-gray-900">Documents requis</h2>
                    <p className="text-sm text-gray-600 -mt-2">JPG, PNG ou PDF — 5 Mo maximum par fichier.</p>
                    <div className="grid gap-3">
                      {RELAY_DOC_FIELDS.map((d) => (
                        <div
                          key={d.key}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl bg-white/80 ring-1 ring-black/5 p-5"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {d.t}
                              {d.required && <span className="ml-1 text-[var(--logo-red)]">*</span>}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">({d.s})</p>
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
                          <label className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/15 transition-smooth hover:bg-black cursor-pointer">
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
                    <TextArea
                      label="Pourquoi souhaitez-vous devenir relais partenaire ?"
                      placeholder="Quelques lignes pour exprimer votre motivation…"
                      value={form.motivation}
                      onChange={(e) => patch("motivation", e.target.value)}
                    />
                  </section>
                ) : null}

                {step === "confirm" ? (
                  <section className="grid gap-4">
                    <h2 className="text-sm font-semibold text-gray-900">Confirmation de demande</h2>
                    <div className="rounded-2xl bg-white/80 ring-1 ring-black/5 p-6">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        Vérifiez vos informations et documents, puis confirmez l'envoi de votre dossier.
                      </p>
                      <div className="mt-4 flex flex-col sm:flex-row gap-3">
                        <button
                          type="button"
                          disabled={submitStatus === "loading"}
                          onClick={submitApplication}
                          className="inline-flex items-center justify-center rounded-xl bg-[var(--logo-red)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--logo-red)]/20 transition-smooth hover:bg-[var(--logo-red-dark)] disabled:opacity-60"
                        >
                          {submitStatus === "loading" ? "Envoi…" : "Confirmer ma demande"}
                        </button>
                      </div>
                      {submitError ? <p className="mt-3 text-sm text-red-600">{submitError}</p> : null}
                    </div>
                    <div className="rounded-2xl bg-white/70 ring-1 ring-black/5 p-6">
                      <h3 className="text-sm font-semibold text-gray-900">Confidentialité et sécurité</h3>
                      <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                        Nous accordons une grande importance à la protection de vos informations. Elles sont utilisées uniquement
                        pour traiter votre demande et vous offrir un service de qualité.
                      </p>
                    </div>
                  </section>
                ) : null}
              </div>

              <div className="mt-10 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={!canPrev}
                  className={[
                    "inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition-smooth",
                    canPrev
                      ? "bg-white/80 text-gray-900 ring-1 ring-black/5 hover:bg-white shadow-sm"
                      : "bg-black/5 text-gray-400 cursor-not-allowed",
                  ].join(" ")}
                >
                  Précédent
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canNext}
                  className={[
                    "inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white transition-smooth",
                    canNext
                      ? "bg-[var(--logo-red)] shadow-lg shadow-[var(--logo-red)]/20 hover:bg-[var(--logo-red-dark)]"
                      : "bg-black/10 text-gray-400 cursor-not-allowed",
                  ].join(" ")}
                >
                  Continuer
                </button>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                Les documents sont stockés de façon sécurisée et accessibles uniquement par l'équipe admin.
              </p>
            </>
          )}
        </div>
      </Reveal>
    </main>
  );
}
