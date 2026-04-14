import { NextResponse } from "next/server";
import { sendComingSoonNewsletterEmailJs } from "@/lib/emailjsComingSoon";

function apiBase() {
  return (process.env.INTERNAL_AUTH_API_URL || process.env.AUTH_API_URL || "http://127.0.0.1:4000").replace(/\/$/, "");
}

function skipBackendForComingSoon(): boolean {
  const v = process.env.COMING_SOON_SKIP_BACKEND?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const payload = {
    email: String(body.email ?? "").trim(),
  };

  let data: { error?: string; ok?: boolean };

  if (skipBackendForComingSoon()) {
    console.warn(
      "[coming-soon-newsletter] COMING_SOON_SKIP_BACKEND activé — pas d’appel au backend (réservé au dev / démo).",
    );
    data = { ok: true };
  } else {
    let res: Response;
    try {
      res = await fetch(`${apiBase()}/public/coming-soon-newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("[coming-soon-newsletter] backend fetch:", err);
      return NextResponse.json(
        {
          error:
            "Le serveur d’application n’est pas joignable. En local : `npm run backend:dev` (port 4000). Sur Netlify (ou autre hébergeur) : définissez `AUTH_API_URL` ou `INTERNAL_AUTH_API_URL` vers l’URL HTTPS publique de l’API. Pour n’appeler que EmailJS sans backend : `COMING_SOON_SKIP_BACKEND=true` (variables d’environnement du site sur Netlify, ou `.env.local` en local).",
        },
        { status: 503 },
      );
    }

    const raw = await res.text();
    try {
      data = (raw ? JSON.parse(raw) : {}) as { error?: string; ok?: boolean };
    } catch {
      return NextResponse.json(
        { error: `Réponse invalide du serveur d’application (HTTP ${res.status}).` },
        { status: 502 },
      );
    }

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
  }

  try {
    if (data?.ok && skipBackendForComingSoon()) {
      await sendComingSoonNewsletterEmailJs(payload.email);
    }
  } catch (err) {
    console.warn("[coming-soon-newsletter] EmailJS:", err);
  }

  return NextResponse.json(data);
}
