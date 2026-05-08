import { createHash, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  SITE_PREVIEW_COOKIE,
  expectedPreviewCookieValue,
  getSitePreviewSecret,
} from "@/lib/site-preview";

export const runtime = "nodejs";

function verifyPassword(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const expectedPw = process.env.SITE_PREVIEW_PASSWORD;
  if (!expectedPw || expectedPw.length < 8) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const password =
    typeof body === "object" &&
    body !== null &&
    "password" in body &&
    typeof (body as { password: unknown }).password === "string"
      ? (body as { password: string }).password
      : "";

  if (!verifyPassword(password, expectedPw)) {
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json({ ok: false, error: "refused" }, { status: 401 });
  }

  const secret = getSitePreviewSecret();
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "server_misconfigured", hint: "SITE_PREVIEW_SECRET ou NEXTAUTH_SECRET requis" },
      { status: 500 }
    );
  }

  const token = await expectedPreviewCookieValue(secret);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SITE_PREVIEW_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
