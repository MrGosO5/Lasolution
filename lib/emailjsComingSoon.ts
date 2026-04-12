import emailjs from "@emailjs/nodejs";

/** Valeurs fournies côté projet ; surcharge avec EMAILJS_* dans `.env.local`. */
const SERVICE_ID_DEFAULT = "service_e9ptm4c";
const TEMPLATE_WAITLIST_DEFAULT = "template_mr9j0ml";
const TEMPLATE_NEWSLETTER_DEFAULT = "template_upuvay2";

function keys(): { publicKey: string; privateKey: string } | null {
  const publicKey = process.env.EMAILJS_PUBLIC_KEY?.trim();
  const privateKey = process.env.EMAILJS_PRIVATE_KEY?.trim();
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey };
}

function serviceId() {
  return process.env.EMAILJS_SERVICE_ID?.trim() || SERVICE_ID_DEFAULT;
}

function templateWaitlist() {
  return process.env.EMAILJS_TEMPLATE_WAITLIST?.trim() || TEMPLATE_WAITLIST_DEFAULT;
}

function templateNewsletter() {
  return process.env.EMAILJS_TEMPLATE_NEWSLETTER?.trim() || TEMPLATE_NEWSLETTER_DEFAULT;
}

/** Si défini dans `.env.local`, envoi d’un accusé de réception au visiteur (template EmailJS avec « To » = `{{to_email}}`). */
function templateWaitlistUserConfirm() {
  return process.env.EMAILJS_TEMPLATE_WAITLIST_CONFIRM?.trim() || "";
}

export async function sendComingSoonWaitlistEmailJs(params: {
  profile: string;
  name: string;
  email: string;
  phoneDial: string;
  phone: string;
  articleUrl: string;
}): Promise<void> {
  const k = keys();
  if (!k) return;

  const profile_label =
    params.profile === "pro" ? "Expédition de colis" : "Achat assisté";
  const full_phone = `${params.phoneDial} ${params.phone}`.trim();
  const article_url =
    params.profile === "buyer" && params.articleUrl ? params.articleUrl : "—";

  try {
    await emailjs.send(
      serviceId(),
      templateWaitlist(),
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
  } catch (err) {
    console.warn("[emailjs] coming-soon waitlist:", err);
  }
}

/**
 * E-mail de confirmation au visiteur (optionnel).
 * Dans EmailJS : champ « To email » du template = `{{to_email}}` (ou variable équivalente selon ton interface).
 */
export async function sendComingSoonWaitlistUserConfirmationEmailJs(params: {
  name: string;
  email: string;
}): Promise<void> {
  const k = keys();
  const tid = templateWaitlistUserConfirm();
  if (!k || !tid) return;

  try {
    await emailjs.send(
      serviceId(),
      tid,
      {
        to_email: params.email,
        name: params.name,
        email: params.email,
      },
      k,
    );
  } catch (err) {
    console.warn("[emailjs] coming-soon waitlist user confirm:", err);
  }
}

export async function sendComingSoonNewsletterEmailJs(email: string): Promise<void> {
  const k = keys();
  if (!k) return;

  try {
    await emailjs.send(
      serviceId(),
      templateNewsletter(),
      { email },
      k,
    );
  } catch (err) {
    console.warn("[emailjs] coming-soon newsletter:", err);
  }
}
