import { NextResponse } from "next/server";
import {
  sendComingSoonWaitlistEmailJs,
  sendComingSoonWaitlistUserConfirmationEmailJs,
} from "@/lib/emailjsComingSoon";

function apiBase() {
  return (process.env.INTERNAL_AUTH_API_URL || process.env.AUTH_API_URL || "http://localhost:4000").replace(/\/$/, "");
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
          "Le serveur d’application n’est pas joignable. Démarrez le backend (ex. port 4000) ou vérifiez INTERNAL_AUTH_API_URL / AUTH_API_URL dans .env.local.",
      },
      { status: 503 },
    );
  }

  const raw = await res.text();
  let data: { error?: string; ok?: boolean };
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
