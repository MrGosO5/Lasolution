import { allCountries } from "country-telephone-data";

export type PhoneDialOption = {
  dial: string;
  iso: string;
  name: string;
};

/** Pays affichés en tête de liste (marché La Solution) */
const PREFERRED_ISO = [
  "bj",
  "tg",
  "ci",
  "sn",
  "ml",
  "bf",
  "ne",
  "gn",
  "td",
  "ga",
  "cg",
  "cm",
  "cd",
  "fr",
  "be",
  "ch",
  "ca",
  "us",
];

const frRegionNames = new Intl.DisplayNames(["fr"], { type: "region" });

function countryLabel(iso2: string, fallback: string): string {
  try {
    return frRegionNames.of(iso2.toUpperCase()) ?? fallback;
  } catch {
    return fallback;
  }
}

function buildPhoneDialOptions(): PhoneDialOption[] {
  const byIso = new Map<string, PhoneDialOption>();

  for (const c of allCountries) {
    const iso = c.iso2.toLowerCase();
    const dial = c.dialCode.startsWith("+") ? c.dialCode : `+${c.dialCode}`;
    if (!iso || !dial) continue;
    byIso.set(iso, {
      dial,
      iso,
      name: countryLabel(iso, c.name),
    });
  }

  const all = Array.from(byIso.values());
  const preferred = new Set(PREFERRED_ISO);

  return all.sort((a, b) => {
    const aPref = preferred.has(a.iso) ? 0 : 1;
    const bPref = preferred.has(b.iso) ? 0 : 1;
    if (aPref !== bPref) return aPref - bPref;
    return a.name.localeCompare(b.name, "fr");
  });
}

export const phoneDialOptions = buildPhoneDialOptions();

/** Validation indicatif côté API (format international) */
export function isValidPhoneDialCode(dial: string): boolean {
  return /^\+\d{1,4}$/.test(dial);
}
