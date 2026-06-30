/** Types SecurityEvent pour les candidatures partenaires. */
const APPLICATION_TYPES = {
  SOLUPACKER: "solupacker_application",
  RELAY: "partner_relay_application",
};

/** Rôles User cibles après acceptation. */
const PARTNER_ROLES = {
  SOLUPACKER: "solupacker",
  RELAY: "relais",
};

/** SecurityEvent.type → User.role */
const TYPE_TO_ROLE = {
  [APPLICATION_TYPES.SOLUPACKER]: PARTNER_ROLES.SOLUPACKER,
  [APPLICATION_TYPES.RELAY]: PARTNER_ROLES.RELAY,
};

/** Documents autorisés par rôle (noms serveur fixes). */
const DOCUMENTS = {
  [PARTNER_ROLES.SOLUPACKER]: ["identity", "photo", "proof"],
  [PARTNER_ROLES.RELAY]: ["identity", "shopFront", "storage", "proof"],
};

/** Documents obligatoires avant soumission. */
const REQUIRED_DOCUMENTS = {
  [PARTNER_ROLES.SOLUPACKER]: ["identity", "photo"],
  [PARTNER_ROLES.RELAY]: ["identity", "shopFront"],
};

const ALL_APPLICATION_TYPES = Object.values(APPLICATION_TYPES);

const ALL_DOCUMENT_TYPES = [...new Set(Object.values(DOCUMENTS).flat())];

const DOCUMENT_LABELS = {
  identity: "Pièce d'identité",
  photo: "Photo",
  proof: "Justificatif",
  shopFront: "Façade boutique",
  storage: "Espace stockage",
};

const PROCESSED_STATUSES = new Set(["accepted", "refused"]);

function roleFromApplicationType(type) {
  return TYPE_TO_ROLE[type] || null;
}

function documentsForRole(role) {
  return DOCUMENTS[role] || [];
}

function requiredDocumentsForRole(role) {
  return REQUIRED_DOCUMENTS[role] || [];
}

function isApplicationType(type) {
  return ALL_APPLICATION_TYPES.includes(type);
}

module.exports = {
  APPLICATION_TYPES,
  PARTNER_ROLES,
  TYPE_TO_ROLE,
  DOCUMENTS,
  REQUIRED_DOCUMENTS,
  ALL_APPLICATION_TYPES,
  ALL_DOCUMENT_TYPES,
  DOCUMENT_LABELS,
  PROCESSED_STATUSES,
  roleFromApplicationType,
  documentsForRole,
  requiredDocumentsForRole,
  isApplicationType,
};
