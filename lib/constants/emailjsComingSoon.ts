/**
 * Constantes EmailJS — page coming soon (liste d’attente + newsletter).
 * Surcharge via les variables d’environnement nommées dans {@link EMAILJS_ENV_KEYS}.
 */
export const EMAILJS_DEFAULTS = {
  SERVICE_ID: "service_e9ptm4c",
  /** Soumettre ma demande — onglet « Achat assisté » (`profile=buyer`). */
  TEMPLATE_WAITLIST_ACHAT_ASSISTE: "template_mr9j0ml",
  /** Soumettre ma demande — onglet « Expédition de colis » (`profile=pro`). */
  TEMPLATE_WAITLIST_EXPEDITION: "template_upuvay2",
  /** Newsletter (bas de page). */
  TEMPLATE_NEWSLETTER: "template_upuvay2",
  PUBLIC_KEY: "ttPiM50wcap4VUCkF",
} as const;

/** Noms des variables d’environnement (`.env.local`, hébergeur, etc.). */
export const EMAILJS_ENV_KEYS = {
  PUBLIC_KEY: "EMAILJS_PUBLIC_KEY",
  PRIVATE_KEY: "EMAILJS_PRIVATE_KEY",
  SERVICE_ID: "EMAILJS_SERVICE_ID",
  TEMPLATE_WAITLIST_ACHAT_ASSISTE: "EMAILJS_TEMPLATE_WAITLIST_ACHAT_ASSISTE",
  TEMPLATE_WAITLIST_BUYER: "EMAILJS_TEMPLATE_WAITLIST_BUYER",
  TEMPLATE_WAITLIST_EXPEDITION: "EMAILJS_TEMPLATE_WAITLIST_EXPEDITION",
  TEMPLATE_WAITLIST_PRO: "EMAILJS_TEMPLATE_WAITLIST_PRO",
  /** Repli historique pour l’onglet achat assisté. */
  TEMPLATE_WAITLIST: "EMAILJS_TEMPLATE_WAITLIST",
  TEMPLATE_NEWSLETTER: "EMAILJS_TEMPLATE_NEWSLETTER",
  TEMPLATE_WAITLIST_CONFIRM: "EMAILJS_TEMPLATE_WAITLIST_CONFIRM",
} as const;

function env(key: keyof typeof EMAILJS_ENV_KEYS): string | undefined {
  return process.env[EMAILJS_ENV_KEYS[key]]?.trim();
}

export function emailjsPublicKeyOrDefault(): string {
  return env("PUBLIC_KEY") || EMAILJS_DEFAULTS.PUBLIC_KEY;
}

export function emailjsPrivateKeyFromEnv(): string | undefined {
  return env("PRIVATE_KEY");
}

export function emailjsServiceIdOrDefault(): string {
  return env("SERVICE_ID") || EMAILJS_DEFAULTS.SERVICE_ID;
}

export function emailjsTemplateWaitlistForProfile(profile: string): string {
  const isPro = String(profile).toLowerCase() === "pro";
  const legacy = env("TEMPLATE_WAITLIST");
  if (isPro) {
    return (
      env("TEMPLATE_WAITLIST_EXPEDITION") ||
      env("TEMPLATE_WAITLIST_PRO") ||
      EMAILJS_DEFAULTS.TEMPLATE_WAITLIST_EXPEDITION
    );
  }
  return (
    env("TEMPLATE_WAITLIST_ACHAT_ASSISTE") ||
    env("TEMPLATE_WAITLIST_BUYER") ||
    legacy ||
    EMAILJS_DEFAULTS.TEMPLATE_WAITLIST_ACHAT_ASSISTE
  );
}

export function emailjsTemplateNewsletterOrDefault(): string {
  return env("TEMPLATE_NEWSLETTER") || EMAILJS_DEFAULTS.TEMPLATE_NEWSLETTER;
}

export function emailjsTemplateWaitlistUserConfirmFromEnv(): string {
  return env("TEMPLATE_WAITLIST_CONFIRM") || "";
}
