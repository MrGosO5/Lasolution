"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/app/site/components/UI";
import { TextInput } from "@/app/site/components/Form";

export default function VerifierEmailPage() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";
  const emailFromUrl = searchParams.get("email") || "";
  const [email, setEmail] = useState(emailFromUrl);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const didVerify = useRef(false);

  async function verifyToken(token: string) {
    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Lien invalide ou expiré.");
        return;
      }
      setStatus("ok");
      setMessage("Votre adresse email est confirmée. Vous pouvez passer commande.");
    } catch {
      setStatus("error");
      setMessage("Réseau indisponible.");
    }
  }

  useEffect(() => {
    if (tokenFromUrl && !didVerify.current) {
      didVerify.current = true;
      void verifyToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  async function resend(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        setStatus("error");
        setMessage("Envoi impossible. Réessayez plus tard.");
        return;
      }
      setStatus("ok");
      setMessage("Si un compte existe et n'est pas encore vérifié, un nouvel email a été envoyé.");
    } catch {
      setStatus("error");
      setMessage("Réseau indisponible.");
    }
  }

  if (tokenFromUrl && status === "idle") {
    void verifyToken(tokenFromUrl);
  }

  return (
    <main className="site-container site-section max-w-lg mx-auto">
      <PageHeader
        eyebrow="Compte"
        title="Vérification email"
        subtitle="Confirmez votre adresse pour débloquer le passage de commande."
      />

      {status === "ok" && message ? (
        <p className="mt-6 text-sm text-emerald-900 rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
          {message}{" "}
          <Link href="/connexion" className="font-semibold underline">
            Se connecter
          </Link>
        </p>
      ) : null}

      {status === "error" && message ? (
        <p className="mt-6 text-sm text-red-700 rounded-xl bg-red-50 px-4 py-3 ring-1 ring-red-200">{message}</p>
      ) : null}

      {status === "loading" ? <p className="mt-6 text-sm text-gray-600">Traitement en cours…</p> : null}

      <form className="mt-8 grid gap-4" onSubmit={resend}>
        <TextInput
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" className="btn btn-primary" disabled={status === "loading"}>
          Renvoyer l'email de vérification
        </button>
      </form>
    </main>
  );
}
