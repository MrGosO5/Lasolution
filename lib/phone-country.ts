import { phoneDialOptions } from "@/lib/phone-dial-options";

const COUNTRY_NAME_TO_ISO: Record<string, string> = {
  benin: "bj",
  "bénin": "bj",
  togo: "tg",
  senegal: "sn",
  "sénégal": "sn",
  "cote d'ivoire": "ci",
  "côte d'ivoire": "ci",
  france: "fr",
  belgique: "be",
  suisse: "ch",
  cameroun: "cm",
  mali: "ml",
  ghana: "gh",
  "burkina faso": "bf",
  niger: "ne",
  guinee: "gn",
  "guinée": "gn",
  tchad: "td",
  gabon: "ga",
  congo: "cg",
  "republique democratique du congo": "cd",
  canada: "ca",
  "etats-unis": "us",
  "états-unis": "us",
};

function normCountry(country: string): string {
  return country
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[''`]/g, "'");
}

export function dialFromCountry(country?: string | null): string | null {
  if (!country?.trim()) return null;
  const norm = normCountry(country);
  if (norm.startsWith("autre")) return null;
  const iso = COUNTRY_NAME_TO_ISO[norm];
  if (!iso) return null;
  return phoneDialOptions.find((o) => o.iso === iso)?.dial ?? null;
}

export function defaultDial(): string {
  return "+229";
}

export function parsePhoneValue(value: string): { dial: string; national: string } {
  const raw = value.trim();
  if (!raw) return { dial: defaultDial(), national: "" };

  const byLength = [...phoneDialOptions].sort((a, b) => b.dial.length - a.dial.length);
  for (const o of byLength) {
    if (raw.startsWith(o.dial)) {
      return { dial: o.dial, national: raw.slice(o.dial.length).replace(/^[\s.-]+/, "") };
    }
    const digits = o.dial.slice(1);
    const compact = raw.replace(/\s/g, "");
    if (compact.startsWith(`00${digits}`)) {
      return { dial: o.dial, national: raw.replace(/^\s*00\d+[\s.-]*/, "") };
    }
  }

  const match = raw.match(/^(\+\d{1,4})\s*(.*)$/);
  if (match) return { dial: match[1], national: match[2] };

  return { dial: defaultDial(), national: raw };
}

export function formatPhoneValue(dial: string, national: string): string {
  const n = national.trim();
  if (!n) return "";
  return `${dial} ${n}`;
}

export function ensurePhoneWithDial(phone: string, country?: string | null): string {
  const trimmed = phone.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) return trimmed;
  const dial = dialFromCountry(country) ?? defaultDial();
  return formatPhoneValue(dial, trimmed);
}
