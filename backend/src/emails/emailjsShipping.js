/**
 * Demande d’expédition — notification équipe via EmailJS (Node).
 * Template : `docs/emailjs/shipping-request.html`
 */
const emailjs = require("@emailjs/nodejs");
const {
  buildShippingRequestTemplateParams,
  buildShippingRequestPlainText,
} = require("./shippingRequestEmail");

const EMAILJS_DEFAULTS = {
  SERVICE_ID: "service_e9ptm4c",
  PUBLIC_KEY: "ttPiM50wcap4VUCkF",
};

function env(name) {
  const v = process.env[name];
  return typeof v === "string" ? v.trim() : undefined;
}

function keys() {
  const publicKey = env("EMAILJS_PUBLIC_KEY") || EMAILJS_DEFAULTS.PUBLIC_KEY;
  const privateKey = env("EMAILJS_PRIVATE_KEY");
  if (!privateKey) return null;
  return { publicKey, privateKey };
}

function templateId() {
  return env("EMAILJS_TEMPLATE_SHIPPING_REQUEST") || "";
}

function teamEmail() {
  return env("EMAILJS_SHIPPING_TEAM_EMAIL") || env("CUSTOMERCARE_EMAIL") || "customercare@lasolution.org";
}

/**
 * @param {Record<string, unknown>} payload — champs du formulaire + photoBuf, photoMime, transportMode
 * @returns {Promise<boolean>}
 */
async function sendShippingRequestEmailJs(payload) {
  const k = keys();
  const tid = templateId();
  if (!k || !tid) {
    if (!k) console.warn("[emailjs] shipping-request: EMAILJS_PRIVATE_KEY absente.");
    if (!tid) console.warn("[emailjs] shipping-request: EMAILJS_TEMPLATE_SHIPPING_REQUEST absente.");
    return false;
  }

  const templateParams = buildShippingRequestTemplateParams(payload);
  const dest = templateParams.destination_country !== "—" ? templateParams.destination_country : "Destination";
  const subject = `[Expédition] Nouvelle demande ${templateParams.transport_mode_label} — ${dest}`;

  try {
    await emailjs.send(
      env("EMAILJS_SERVICE_ID") || EMAILJS_DEFAULTS.SERVICE_ID,
      tid,
      {
        ...templateParams,
        to_email: teamEmail(),
        subject,
        body_text: buildShippingRequestPlainText(payload),
        reply_to: templateParams.reply_to || teamEmail(),
      },
      k,
    );
    console.log(`[emailjs] shipping-request envoyé → ${teamEmail()}`);
    return true;
  } catch (err) {
    console.warn("[emailjs] shipping-request:", err?.message || err);
    return false;
  }
}

module.exports = {
  sendShippingRequestEmailJs,
  buildShippingRequestTemplateParams,
};
