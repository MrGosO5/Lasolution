/**
 * Coming soon — notifications équipe via EmailJS (Node).
 * Variables et défauts alignés sur `lib/constants/emailjsComingSoon.ts` (Next).
 */
const emailjs = require("@emailjs/nodejs");

const EMAILJS_DEFAULTS = {
  SERVICE_ID: "service_e9ptm4c",
  TEMPLATE_WAITLIST_ACHAT_ASSISTE: "template_mr9j0ml",
  TEMPLATE_WAITLIST_EXPEDITION: "template_upuvay2",
  TEMPLATE_NEWSLETTER: "template_upuvay2",
  PUBLIC_KEY: "ttPiM50wcap4VUCkF",
};

function env(name) {
  const v = process.env[name];
  return typeof v === "string" ? v.trim() : undefined;
}

function emailjsPublicKeyOrDefault() {
  return env("EMAILJS_PUBLIC_KEY") || EMAILJS_DEFAULTS.PUBLIC_KEY;
}

function emailjsPrivateKeyFromEnv() {
  return env("EMAILJS_PRIVATE_KEY");
}

function emailjsServiceIdOrDefault() {
  return env("EMAILJS_SERVICE_ID") || EMAILJS_DEFAULTS.SERVICE_ID;
}

function emailjsTemplateWaitlistForProfile(profile) {
  const isPro = String(profile).toLowerCase() === "pro";
  const legacy = env("EMAILJS_TEMPLATE_WAITLIST");
  if (isPro) {
    return (
      env("EMAILJS_TEMPLATE_WAITLIST_EXPEDITION") ||
      env("EMAILJS_TEMPLATE_WAITLIST_PRO") ||
      EMAILJS_DEFAULTS.TEMPLATE_WAITLIST_EXPEDITION
    );
  }
  return (
    env("EMAILJS_TEMPLATE_WAITLIST_ACHAT_ASSISTE") ||
    env("EMAILJS_TEMPLATE_WAITLIST_BUYER") ||
    legacy ||
    EMAILJS_DEFAULTS.TEMPLATE_WAITLIST_ACHAT_ASSISTE
  );
}

function emailjsTemplateNewsletterOrDefault() {
  return env("EMAILJS_TEMPLATE_NEWSLETTER") || EMAILJS_DEFAULTS.TEMPLATE_NEWSLETTER;
}

function keys() {
  const publicKey = emailjsPublicKeyOrDefault();
  const privateKey = emailjsPrivateKeyFromEnv();
  if (!privateKey) return null;
  return { publicKey, privateKey };
}

/**
 * @returns {Promise<boolean>} true si envoyé via EmailJS
 */
async function sendComingSoonWaitlistEmailJs(params) {
  const k = keys();
  if (!k) return false;

  const profile_label =
    params.profile === "pro" ? "Expédition de colis" : "Achat assisté";
  const full_phone = `${params.phoneDial} ${params.phone}`.trim();
  const article_url =
    params.profile === "buyer" && params.articleUrl ? params.articleUrl : "—";

  try {
    await emailjs.send(
      emailjsServiceIdOrDefault(),
      emailjsTemplateWaitlistForProfile(params.profile),
      {
        profile_label,
        name: params.name,
        email: params.email,
        full_phone,
        article_url,
        submitted_at: new Date().toISOString(),
      },
      k,
    );
    return true;
  } catch (err) {
    console.warn("[emailjs] coming-soon waitlist:", err);
    return false;
  }
}

/**
 * @returns {Promise<boolean>} true si envoyé via EmailJS
 */
async function sendComingSoonNewsletterEmailJs(email) {
  const k = keys();
  if (!k) return false;

  try {
    await emailjs.send(
      emailjsServiceIdOrDefault(),
      emailjsTemplateNewsletterOrDefault(),
      { email },
      k,
    );
    return true;
  } catch (err) {
    console.warn("[emailjs] coming-soon newsletter:", err);
    return false;
  }
}

module.exports = {
  sendComingSoonWaitlistEmailJs,
  sendComingSoonNewsletterEmailJs,
};
