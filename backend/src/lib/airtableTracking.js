/**
 * Numéro de suivi La Solution — généré par l’app (source de vérité).
 *
 * Format canonique MVP :
 *   LASOL-{10 caractères Crockford Base32}
 *   Exemple : LASOL-8F2KD7P41M
 *   Alphabet : 0123456789ABCDEFGHJKMNPQRSTVWXYZ (pas de I, L, O, U)
 *
 * Dérivé de façon déterministe de l’entityId → même ID ⇒ même numéro (immuable).
 * Formules Airtable historiques et LASOL-XXXXXXXX (8 chars) : lecture seule (compat).
 */

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const LASOL_CANONICAL_RE = /^LASOL-[0-9A-HJKMNP-TV-Z]{10}$/;
const LASOL_LEGACY_DASH_RE = /^LASOL-[A-Z0-9]{8}$/;
const LASOL_FORMULA_RE = /^LASOL[A-Z0-9]{10,}$/;

function isCanonicalLasolTracking(value) {
  return LASOL_CANONICAL_RE.test(String(value || "").trim().toUpperCase());
}

function isLasolTrackingNumber(value) {
  const raw = String(value || "").trim().toUpperCase();
  return LASOL_CANONICAL_RE.test(raw) || LASOL_LEGACY_DASH_RE.test(raw) || LASOL_FORMULA_RE.test(raw);
}

/**
 * Mélange déterministe partagé (Node + front) → 10 chars Crockford.
 */
function crockfordFromEntityId(entityId, length = 10) {
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

function formatAirtableTrackingNumber(entityId) {
  return `LASOL-${crockfordFromEntityId(entityId, 10)}`;
}

function normalizeLasolTrackingNumber(value, entityId) {
  const raw = String(value || "").trim().toUpperCase();
  if (isCanonicalLasolTracking(raw)) return raw;
  if (LASOL_LEGACY_DASH_RE.test(raw) || LASOL_FORMULA_RE.test(raw)) return raw;
  return formatAirtableTrackingNumber(entityId);
}

function resolveLasolTrackingFromMeta(meta, entityId) {
  const label = String(meta?.labelTrackingNumber || "").trim();
  if (isLasolTrackingNumber(label)) return label.toUpperCase();
  const stored = String(meta?.trackingNumber || "").trim();
  if (isLasolTrackingNumber(stored)) return stored.toUpperCase();
  if (entityId) return formatAirtableTrackingNumber(entityId);
  return null;
}

module.exports = {
  CROCKFORD,
  LASOL_CANONICAL_RE,
  LASOL_LEGACY_DASH_RE,
  LASOL_FORMULA_RE,
  formatAirtableTrackingNumber,
  isCanonicalLasolTracking,
  isLasolTrackingNumber,
  normalizeLasolTrackingNumber,
  resolveLasolTrackingFromMeta,
};
