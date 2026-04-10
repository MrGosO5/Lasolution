"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Reveal } from "@/app/site/components/Reveal";
import { Select, TextArea, TextInput, Toggle } from "@/app/site/components/Form";
import { PageHeader } from "@/app/site/components/UI";

type StepId = "personal" | "relay" | "docs" | "confirm";

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
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currentIdx = useMemo(() => STEPS.findIndex((s) => s.id === step), [step]);

  const canPrev = currentIdx > 0;
  const canNext = currentIdx < STEPS.length - 1;

  function goPrev() {
    if (!canPrev) return;
    setStep(STEPS[currentIdx - 1]!.id);
  }
  function goNext() {
    if (!canNext) return;
    setStep(STEPS[currentIdx + 1]!.id);
  }

  function patch<K extends keyof RelayForm>(key: K, value: RelayForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submitApplication() {
    setSubmitStatus("loading");
    setSubmitError(null);
    try {
      const res = await fetch("/api/partner-relay-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
                Nous avons bien reçu votre dossier. L’équipe reviendra vers vous par email. Les pièces jointes pourront être
                demandées à l’étape suivante du processus.
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
                      <TextInput label="Nom" placeholder="James" value={form.lastName} onChange={(e) => patch("lastName", e.target.value)} />
                      <TextInput label="Prénom" placeholder="Emile" value={form.firstName} onChange={(e) => patch("firstName", e.target.value)} />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextInput label="Date de naissance" placeholder="11/06/1995" value={form.dob} onChange={(e) => patch("dob", e.target.value)} />
                      <Select label="Nationalité" value={form.nationality} onChange={(e) => patch("nationality", e.target.value)}>
                        <option>France</option>
                        <option>Bénin</option>
                        <option>Togo</option>
                        <option>Sénégal</option>
                        <option>Côte d’Ivoire</option>
                      </Select>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextInput label="Numéro de téléphone" placeholder="+33 152629176" value={form.phone} onChange={(e) => patch("phone", e.target.value)} />
                      <TextInput label="Email" type="email" placeholder="emilejames@gmail.com" value={form.email} onChange={(e) => patch("email", e.target.value)} required />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextInput label="Adresse" placeholder="France, Paris" value={form.address} onChange={(e) => patch("address", e.target.value)} />
                      <TextInput label="WhatsApp (facultatif)" placeholder="+33 152629176" value={form.whatsapp} onChange={(e) => patch("whatsapp", e.target.value)} />
                    </div>
                  </section>
                ) : null}

                {step === "relay" ? (
                  <section className="grid gap-4">
                    <h2 className="text-sm font-semibold text-gray-900">Informations du point relais</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextInput label="Nom du point relai" placeholder="Nom du point relais" value={form.relayName} onChange={(e) => patch("relayName", e.target.value)} />
                      <TextInput label="Adresse complète" placeholder="Rue, ville, pays" value={form.relayAddress} onChange={(e) => patch("relayAddress", e.target.value)} />
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
                      <Toggle label="Avez-vous une pièce d’identité valide ?" value={form.hasValidId} onChange={(v) => patch("hasValidId", v)} />
                    </div>
                  </section>
                ) : null}

                {step === "docs" ? (
                  <section className="grid gap-4">
                    <h2 className="text-sm font-semibold text-gray-900">Documents requis</h2>
                    <div className="grid gap-3">
                      {[
                        { t: "Pièce d’identité du responsable", s: "scan ou image" },
                        { t: "Photo de la boutique", s: "scan ou image" },
                        { t: "Photo de l’espace de stockage", s: "scan ou image" },
                        { t: "Justificatif d’adresse (optionnel)", s: "scan ou image" },
                      ].map((d) => (
                        <div
                          key={d.t}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl bg-white/80 ring-1 ring-black/5 p-5"
                        >
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{d.t}</p>
                            <p className="mt-1 text-xs text-gray-500">({d.s})</p>
                          </div>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/15 transition-smooth hover:bg-black"
                          >
                            Téléverser
                          </button>
                        </div>
                      ))}
                    </div>
                    <TextArea
                      label="Pourquoi souhaitez-vous devenir relais partenaire ?"
                      placeholder="Quelques lignes pour exprimer votre motivation…"
                      value={form.motivation}
                      onChange={(e) => patch("motivation", e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      L’upload de fichiers sera branché dans une prochaine itération ; la motivation et les infos précédentes sont
                      enregistrées avec la demande.
                    </p>
                  </section>
                ) : null}

                {step === "confirm" ? (
                  <section className="grid gap-4">
                    <h2 className="text-sm font-semibold text-gray-900">Confirmation de demande</h2>
                    <div className="rounded-2xl bg-white/80 ring-1 ring-black/5 p-6">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        Contrat de collaboration: téléversez le contrat signé dans une prochaine version ; pour l’instant,
                        confirmez l’envoi de votre dossier avec les informations saisies.
                      </p>
                      <div className="mt-4 flex flex-col sm:flex-row gap-3">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/15 transition-smooth hover:bg-black opacity-60 cursor-not-allowed"
                          disabled
                        >
                          Téléverser le contrat (PDF) — bientôt
                        </button>
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
                Soumission : SecurityEvent + email équipe (si SMTP). Base requise.
              </p>
            </>
          )}
        </div>
      </Reveal>
    </main>
  );
}
