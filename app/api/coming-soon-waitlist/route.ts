import { NextResponse } from "next/server";
import {
  sendComingSoonWaitlistEmailJs,
  sendComingSoonWaitlistUserConfirmationEmailJs,
} from "@/lib/emailjsComingSoon";

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
    profile: String(body.profile ?? "").trim().toLowerCase(),
    name: String(body.name ?? "").trim(),
    email: String(body.email ?? "").trim(),
    phoneDial: String(body.phoneDial ?? "").trim(),
    phone: String(body.phone ?? "").trim(),
    articleUrl: String(body.articleUrl ?? "").trim(),
  };

  let data: { error?: string; ok?: boolean };

  if (skipBackendForComingSoon()) {
    console.warn(
      "[coming-soon-waitlist] COMING_SOON_SKIP_BACKEND activé — pas d’appel au backend (réservé au dev / démo).",
    );
    data = { ok: true };
  } else {
    let res: Response;
    try {
      res = await fetch(`${apiBase()}/public/coming-soon-waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("[coming-soon-waitlist] backend fetch:", err);
      return NextResponse.json(
        {
          error:
            "Le serveur d’application n’est pas joignable. Démarrez le backend (ex. `npm run backend:dev` sur le port 4000), ou définissez INTERNAL_AUTH_API_URL / AUTH_API_URL. Pour tester uniquement EmailJS en local : COMING_SOON_SKIP_BACKEND=true dans .env.local.",
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
    await sendComingSoonWaitlistEmailJs(payload);
    await sendComingSoonWaitlistUserConfirmationEmailJs({
      name: payload.name,
      email: payload.email,
    });
  } catch (err) {
    console.warn("[coming-soon-waitlist] EmailJS:", err);
  }

  return NextResponse.json(data);
}
