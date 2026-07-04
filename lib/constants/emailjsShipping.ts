/**
 * EmailJS — notification équipe pour une demande d’expédition (formulaire /expedier-un-colis).
 * Template HTML : `docs/emailjs/shipping-request.html`
 */
export const EMAILJS_SHIPPING_DEFAULTS = {
  SERVICE_ID: "service_e9ptm4c",
  PUBLIC_KEY: "ttPiM50wcap4VUCkF",
} as const;

export const EMAILJS_SHIPPING_ENV_KEYS = {
  PUBLIC_KEY: "EMAILJS_PUBLIC_KEY",
  PRIVATE_KEY: "EMAILJS_PRIVATE_KEY",
  SERVICE_ID: "EMAILJS_SERVICE_ID",
  TEMPLATE_SHIPPING_REQUEST: "EMAILJS_TEMPLATE_SHIPPING_REQUEST",
  TEAM_EMAIL: "EMAILJS_SHIPPING_TEAM_EMAIL",
} as const;

function env(key: keyof typeof EMAILJS_SHIPPING_ENV_KEYS): string | undefined {
  return process.env[EMAILJS_SHIPPING_ENV_KEYS[key]]?.trim();
}

export function emailjsShippingPublicKeyOrDefault(): string {
  return env("PUBLIC_KEY") || EMAILJS_SHIPPING_DEFAULTS.PUBLIC_KEY;
}

export function emailjsShippingPrivateKeyFromEnv(): string | undefined {
  return env("PRIVATE_KEY");
}

export function emailjsShippingServiceIdOrDefault(): string {
  return env("SERVICE_ID") || EMAILJS_SHIPPING_DEFAULTS.SERVICE_ID;
}

export function emailjsShippingTemplateIdFromEnv(): string {
  return env("TEMPLATE_SHIPPING_REQUEST") || "";
}

export function emailjsShippingTeamEmailOrDefault(): string {
  return env("TEAM_EMAIL") || process.env.CUSTOMERCARE_EMAIL || "customercare@lasolution.org";
}
