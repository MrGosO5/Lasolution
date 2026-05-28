import { NextRequest, NextResponse } from "next/server";
import { getBackendAccessToken } from "@/lib/backend-access-token";

function apiBase() {
  return (
    process.env.INTERNAL_AUTH_API_URL ||
    process.env.AUTH_API_URL ||
    "http://localhost:4000"
  ).replace(/\/$/, "");
}

export async function GET(req: NextRequest) {
  const token = await getBackendAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const qs = req.nextUrl.searchParams.toString();
  const res = await fetch(`${apiBase()}/me/testimonials${qs ? `?${qs}` : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const text = await res.text();
  try {
    const data = JSON.parse(text);
    return NextResponse.json(data, { status: res.status });
  } catch {
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") || "text/plain" },
    });
  }
}
