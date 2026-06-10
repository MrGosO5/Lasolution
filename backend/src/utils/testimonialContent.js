const MAX_MESSAGE_LENGTH = 2000;
const MAX_NAME_LENGTH = 80;

const HTML_TAG_PATTERN = /<[^>]+>/;
const SCRIPT_TAG_PATTERN = /<script\b/i;

/** URL explicite — évite les faux positifs du type « ce service. » */
const URL_PATTERN =
  /(?:https?:\/\/|www\.)[^\s]+|\b[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.(?:com|fr|net|org|io|co|be|ch|tg|bj|sn|ci)\b(?:\/[^\s]*)?/i;

const BLOCKED_WORDS = [
  "merde",
  "putain",
  "connard",
  "connasse",
  "enculé",
  "encule",
  "fdp",
  "nique",
  "salope",
  "batard",
  "bâtard",
];

function containsBlockedWord(text) {
  const lower = String(text || "").toLowerCase();
  return BLOCKED_WORDS.some((word) => {
    const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    return re.test(lower);
  });
}

function reject(message) {
  return { error: message };
}

function checkTextField(label, value, maxLen, { checkUrl = false, checkBlocked = false } = {}) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return reject(`${label} est obligatoire.`);
  if (trimmed.length > maxLen) return reject(`${label} : ${maxLen} caractères maximum.`);
  if (HTML_TAG_PATTERN.test(trimmed) || SCRIPT_TAG_PATTERN.test(trimmed)) {
    return reject(`${label} : balises HTML non autorisées.`);
  }
  if (checkUrl && URL_PATTERN.test(trimmed)) {
    return reject(`${label} : les liens ne sont pas autorisés.`);
  }
  if (checkBlocked && containsBlockedWord(trimmed)) {
    return reject(`${label} : langage inapproprié.`);
  }
  return { value: trimmed };
}

function validateTestimonialContent({ clientName, city, country, message }) {
  const name = checkTextField("Le nom", clientName, MAX_NAME_LENGTH, { checkUrl: true });
  if (name.error) return name;

  const cityR = checkTextField("La ville", city, MAX_NAME_LENGTH, { checkUrl: true });
  if (cityR.error) return cityR;

  const countryR = checkTextField("Le pays", country, MAX_NAME_LENGTH, { checkUrl: true });
  if (countryR.error) return countryR;

  const msgTrim = String(message || "").trim();
  if (msgTrim.length < 20) {
    return reject("Le message doit contenir au moins 20 caractères.");
  }
  if (msgTrim.length > MAX_MESSAGE_LENGTH) {
    return reject(`Le message : ${MAX_MESSAGE_LENGTH} caractères maximum.`);
  }
  if (HTML_TAG_PATTERN.test(msgTrim) || SCRIPT_TAG_PATTERN.test(msgTrim)) {
    return reject("Le message : balises HTML non autorisées.");
  }
  if (URL_PATTERN.test(msgTrim)) {
    return reject("Le message : les liens ne sont pas autorisés.");
  }
  if (containsBlockedWord(msgTrim)) {
    return reject("Le message contient un langage inapproprié.");
  }

  return {
    data: {
      clientName: name.value,
      city: cityR.value,
      country: countryR.value,
      message: msgTrim,
    },
  };
}

module.exports = { validateTestimonialContent, URL_PATTERN };
