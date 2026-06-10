import { NextResponse } from "next/server";

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

  let res: Response;
  try {
    res = await fetch(`${apiBase()}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error("[register] backend fetch:", err);
    return NextResponse.json(
      {
        error:
          "Le serveur d'application n'est pas joignable. En local : lancez `npm run backend:dev` (port 4000), ou utilisez `npm run start:dev` pour démarrer frontend + backend.",
      },
      { status: 503 },
    );
  }

  const data = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean };
  return NextResponse.json(data, { status: res.status });
}
