/**
 * Portail d’accès au site (prévisualisation locale / préprod).
 * Activé lorsque SITE_PREVIEW_PASSWORD est défini (≥ 8 caractères).
 * Jeton cookie = HMAC-SHA256(SITE_PREVIEW_SECRET ou NEXTAUTH_SECRET, message fixe).
 */

export const SITE_PREVIEW_COOKIE = "lasolution_site_preview";

const PREVIEW_HMAC_MSG = "lasolution-site-preview-v1";

export function isSitePreviewEnabled(): boolean {
  const p = process.env.SITE_PREVIEW_PASSWORD;
  return typeof p === "string" && p.length >= 8;
}

export function getSitePreviewSecret(): string {
  return (
    process.env.SITE_PREVIEW_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    ""
  );
}

export async function expectedPreviewCookieValue(secret: string): Promise<string> {
  if (!secret) return "";
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(PREVIEW_HMAC_MSG));
  return Buffer.from(sig).toString("base64url");
}

export async function isValidPreviewCookie(
  cookieValue: string | undefined,
  secret: string
): Promise<boolean> {
  if (!cookieValue || !secret) return false;
  const expected = await expectedPreviewCookieValue(secret);
  if (expected.length !== cookieValue.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ cookieValue.charCodeAt(i);
  }
  return diff === 0;
}

export function isSitePreviewBypassPath(pathname: string): boolean {
  if (pathname === "/acces-preview") return true;
  if (pathname.startsWith("/api/site-preview")) return true;
  if (pathname.startsWith("/api/auth")) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname === "/favicon.ico") return true;
  if (/\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$/i.test(pathname)) return true;
  return false;
}
