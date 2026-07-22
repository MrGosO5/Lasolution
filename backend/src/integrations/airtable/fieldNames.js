/**
 * Noms de champs table Colis (base de test / formulaires Airtable).
 * Les espaces en fin de libellé sont significatifs côté API Airtable.
 */
const COLIS_FIELDS = {
  brand: "Marque/Origine du Colis",
  inboundTracking: "Numéro de Suivi de commande/Colis",
  /** Champ formule (lecture seule) — ne pas écrire. */
  lasolTracking: "Numéro de Suivi La Solution ",
  orderStatus: "OrderStatus",
  orderId: "OrderID",
  lastName: "Nom",
  firstName: "Prénom",
  recipientLast: "Nom du destinataire ",
  recipientFirst: "Prénom du destinataire",
  /** Double espace + espace final. */
  deliveryMode: "Mode de  livraison ",
  countryCity:
    "Pour bien préparer l'envoi, pourriez vous nous indiquer le pays et la ville de livraison ? 🗺️",
  whatsapp: "Pour faciliter nos échanges, pourriez-vous nous partager votre numéro WhatsApp ? ",
  email:
    "Pour vous envoyez des notifications de votre colis pouvez vous nous communiquer votre adresse mail svp ? ",
  recipientPhone: "Numéro du destinataire",
  address:
    "Adresse de livraison (Quartier, Maison, Précision Supplémentaires pour faciliter la livraison)  ",
  /**
   * Contenu du Colis = pièces jointes (non texte).
   * Pas de champ Notes → marqueur [lasolution_id:…] dans l’adresse (texte libre).
   */
  notes: "Adresse de livraison (Quartier, Maison, Précision Supplémentaires pour faciliter la livraison)  ",
  instructions: "Instruction de livraison ",
  weight: "Poids (Kg)",
  shippedDate: "Date d'envoi du Colis ",
  zohoBilling: "Facturation dans Zoho Books",
  qr: "QR linktree",
};

/** Champs où chercher le marqueur au pull. */
const LEGACY_NOTES_FIELDS = [
  COLIS_FIELDS.address,
  COLIS_FIELDS.notes,
  "Notes pour préparation de Commandes",
  "Contenu du Colis",
  "Instruction de livraison ",
];

module.exports = { COLIS_FIELDS, LEGACY_NOTES_FIELDS };
