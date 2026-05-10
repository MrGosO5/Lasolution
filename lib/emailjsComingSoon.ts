import emailjs from "@emailjs/nodejs";
import {
  emailjsPrivateKeyFromEnv,
  emailjsPublicKeyOrDefault,
  emailjsServiceIdOrDefault,
  emailjsTemplateNewsletterOrDefault,
  emailjsTemplateWaitlistForProfile,
  emailjsTemplateWaitlistUserConfirmFromEnv,
} from "@/lib/constants/emailjsComingSoon";

/**
 * Coming soon — EmailJS
 * - « Soumettre ma demande » : onglet **Achat assisté** (`profile=buyer`) ou **Expédition de colis** (`profile=pro`).
 * - **Newsletter** (bas de page) : variable `email` uniquement.
 *
 * Identifiants et clés par défaut : `lib/constants/emailjsComingSoon.ts` (+ surcharge `.env.local`, voir `EMAILJS_ENV_KEYS`).
 */

function keys(): { publicKey: string; privateKey: string } | null {
  const publicKey = emailjsPublicKeyOrDefault();
  const privateKey = emailjsPrivateKeyFromEnv();
  if (!privateKey) return null;
  return { publicKey, privateKey };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatArticleLinks(value: string): {
  article_url: string;
  article_url_html: string;
  article_count: number;
} {
  const links = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (links.length === 0) {
    return { article_url: "—", article_url_html: "—", article_count: 0 };
  }

  return {
    article_url: links.map((link, index) => `Lien ${index + 1} : ${link}`).join("\n"),
    article_url_html: `<ol style="margin:0;padding-left:20px;">${links
      .map((link) => {
        const safeLink = escapeHtml(link);
        return `<li style="margin:0 0 8px;word-break:break-all;"><a href="${safeLink}" style="color:#d12e5e;">${safeLink}</a></li>`;
      })
      .join("")}</ol>`,
    article_count: links.length,
  };
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
  const articleLinks =
    params.profile === "buyer" ? formatArticleLinks(params.articleUrl) : formatArticleLinks("");

  try {
    await emailjs.send(
      emailjsServiceIdOrDefault(),
      emailjsTemplateWaitlistForProfile(params.profile),
      {
        profile_label,
        name: params.name,
        email: params.email,
        full_phone,
        article_url: articleLinks.article_url,
        article_url_html: articleLinks.article_url_html,
        article_count: articleLinks.article_count,
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
  const tid = emailjsTemplateWaitlistUserConfirmFromEnv();
  if (!k || !tid) return;

  try {
    await emailjs.send(
      emailjsServiceIdOrDefault(),
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
      emailjsServiceIdOrDefault(),
      emailjsTemplateNewsletterOrDefault(),
      { email },
      k,
    );
  } catch (err) {
    console.warn("[emailjs] coming-soon newsletter:", err);
  }
}
