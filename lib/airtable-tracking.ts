/**
 * Numéro de suivi La Solution — même règles que backend/src/lib/airtableTracking.js
 *
 * Format : LASOL-{10 Crockford Base32}  ex. LASOL-8F2KD7P41M
 */

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export const LASOL_CANONICAL_RE = /^LASOL-[0-9A-HJKMNP-TV-Z]{10}$/;
export const LASOL_LEGACY_DASH_RE = /^LASOL-[A-Z0-9]{8}$/;
export const LASOL_FORMULA_RE = /^LASOL[A-Z0-9]{10,}$/;

export function isLasolTrackingNumber(value: unknown): boolean {
  const raw = String(value ?? "").trim().toUpperCase();
  return LASOL_CANONICAL_RE.test(raw) || LASOL_LEGACY_DASH_RE.test(raw) || LASOL_FORMULA_RE.test(raw);
}

function crockfordFromEntityId(entityId: string, length = 10): string {
  const s = String(entityId || "0");
  let acc = 2166136261;
  let out = "";
  for (let i = 0; out.length < length; i++) {
    const c = s.charCodeAt(i % s.length) || 0;
    acc ^= c + i * 17;
    acc = Math.imul(acc ^ (acc >>> 13), 1274126177) >>> 0;
    out += CROCKFORD[acc % 32];
  }
  return out;
}

export function formatAirtableTrackingNumber(entityId: string): string {
  return `LASOL-${crockfordFromEntityId(entityId, 10)}`;
}

export function resolveLasolTrackingNumber(
  entityId: string,
  meta?: { labelTrackingNumber?: string | null; trackingNumber?: string | null } | null,
): string {
  const label = String(meta?.labelTrackingNumber ?? "").trim();
  if (isLasolTrackingNumber(label)) return label.toUpperCase();
  const stored = String(meta?.trackingNumber ?? "").trim();
  if (isLasolTrackingNumber(stored)) return stored.toUpperCase();
  return formatAirtableTrackingNumber(entityId);
}
