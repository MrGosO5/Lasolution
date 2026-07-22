/** Mapping OrderStatus Airtable ↔ codes app (base de test Lasolution). */

const APP_TO_AIRTABLE = {
  AWAITING_RECEPTION: "En attente de réception ",
  RECEIVED_AT_WAREHOUSE: "Reçu à Paris ",
  IN_TRANSIT: "En Transit",
  DELAYED: "Colis retardé",
  RECEIVED_COTONOU: "Reçu à Cotonou",
  RECEIVED_LIBREVILLE: "Reçu à Libreville",
  RECEIVED_LOME: "Reçu à Lomé",
  AVAILABLE_FOR_PICKUP: "Disponible pour récupération",
  DELIVERED: "Livré",
  CANCELLED: "Annulée",
  WRONG_DELIVERY: "Livraison erronée",
};

const AIRTABLE_ALIASES = {
  "en attente de réception": "AWAITING_RECEPTION",
  "reçu à paris": "RECEIVED_AT_WAREHOUSE",
  "reçu à l'entrepôt": "RECEIVED_AT_WAREHOUSE",
  "reçu a paris": "RECEIVED_AT_WAREHOUSE",
  "en transit": "IN_TRANSIT",
  "colis retardé": "DELAYED",
  "colis retarde": "DELAYED",
  "reçu à cotonou": "RECEIVED_COTONOU",
  "reçu a cotonou": "RECEIVED_COTONOU",
  "reçu à libreville": "RECEIVED_LIBREVILLE",
  "reçu a libreville": "RECEIVED_LIBREVILLE",
  "reçu à lomé": "RECEIVED_LOME",
  "reçu a lome": "RECEIVED_LOME",
  "disponible pour récupération": "AVAILABLE_FOR_PICKUP",
  livré: "DELIVERED",
  livre: "DELIVERED",
  annulée: "CANCELLED",
  annulé: "CANCELLED",
  annulee: "CANCELLED",
  "livraison erronée": "WRONG_DELIVERY",
  "livraison erronee": "WRONG_DELIVERY",
};

function normalizeLabel(raw) {
  return String(raw || "")
    .trim()
    .replace(/\s+/g, " ");
}

function appStatusToAirtable(status) {
  const key = String(status || "AWAITING_RECEPTION").toUpperCase();
  return APP_TO_AIRTABLE[key] || APP_TO_AIRTABLE.AWAITING_RECEPTION;
}

function airtableStatusToApp(label) {
  const normalized = normalizeLabel(label).toLowerCase();
  if (AIRTABLE_ALIASES[normalized]) return AIRTABLE_ALIASES[normalized];
  for (const [code, airtableLabel] of Object.entries(APP_TO_AIRTABLE)) {
    if (normalizeLabel(airtableLabel).toLowerCase() === normalized) return code;
  }
  return null;
}

const PARCEL_STATUS_TO_APP = {
  PENDING: "AWAITING_RECEPTION",
  WAREHOUSE_RECEIVED: "RECEIVED_AT_WAREHOUSE",
  WEIGHT_CAPTURED: "RECEIVED_AT_WAREHOUSE",
  SHIPPED: "IN_TRANSIT",
  IN_TRANSIT: "IN_TRANSIT",
  OUT_FOR_DELIVERY: "IN_TRANSIT",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
};

function parcelStatusToAirtable(parcelStatus) {
  const key = String(parcelStatus || "").toUpperCase();
  const appCode = PARCEL_STATUS_TO_APP[key] || "AWAITING_RECEPTION";
  return appStatusToAirtable(appCode);
}

module.exports = {
  APP_TO_AIRTABLE,
  appStatusToAirtable,
  airtableStatusToApp,
  parcelStatusToAirtable,
  normalizeLabel,
};
