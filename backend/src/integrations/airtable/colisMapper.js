const { appStatusToAirtable, parcelStatusToAirtable } = require("./statusMap");
const { COLIS_FIELDS, LEGACY_NOTES_FIELDS } = require("./fieldNames");

const LASOLUTION_ID_PREFIX = "[lasolution_id:";

function splitName(full) {
  const parts = String(full || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { last: "", first: "" };
  if (parts.length === 1) return { last: parts[0], first: "" };
  return { last: parts[0], first: parts.slice(1).join(" ") };
}

function transportToAirtable(mode) {
  const m = String(mode || "").toUpperCase();
  if (m === "AIR") return "Transport Aérien ";
  if (m === "SEA") return "Transport Maritime ";
  return null;
}

function invoiceStatusToAirtable(invoiceStatus) {
  const s = String(invoiceStatus || "").toUpperCase();
  if (s === "APPROVED" || s === "SENT") return "Facturée dans Zoho Books ";
  if (s === "PAID") return "Facture payée";
  if (s === "DRAFT") return "En attente d'informations sur le poids ";
  return null;
}

function formatDateForAirtable(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

function lasolutionIdMarker(id) {
  return `${LASOLUTION_ID_PREFIX}${id}]`;
}

function extractLasolutionId(notes) {
  const m = /\[lasolution_id:([^\]]+)\]/.exec(String(notes || ""));
  return m ? m[1] : null;
}

function extractLasolutionIdFromFields(fields) {
  if (!fields || typeof fields !== "object") return null;
  for (const key of LEGACY_NOTES_FIELDS) {
    const id = extractLasolutionId(fields[key]);
    if (id) return id;
  }
  return null;
}

function appendLasolutionId(notes, id) {
  const base = String(notes || "").replace(/\[lasolution_id:[^\]]+\]/g, "").trim();
  const marker = lasolutionIdMarker(id);
  return base ? `${base}\n${marker}` : marker;
}

/** Expédition standalone → champs table Colis. */
function shippingRequestToColisFields({ event, meta, clientEmail }) {
  const m = meta || {};
  const sender = splitName(m.senderName);
  const recipient = splitName(m.recipientName);
  const F = COLIS_FIELDS;

  const fields = {
    [F.brand]: m.senderName || null,
    [F.inboundTracking]:
      m.inboundTrackingNumber || m.trackingNumber || m.labelTrackingNumber || null,
    [F.orderStatus]: appStatusToAirtable(m.status),
    [F.lastName]: sender.last || null,
    [F.firstName]: sender.first || null,
    [F.recipientLast]: recipient.last || null,
    [F.recipientFirst]: recipient.first || null,
    [F.deliveryMode]: transportToAirtable(m.transportMode),
    [F.whatsapp]: m.senderPhone || null,
    [F.email]: clientEmail || null,
    [F.recipientPhone]: m.recipientPhone || null,
    [F.address]: appendLasolutionId(m.destinationAddress || m.adminNotes || m.notes, `ship:${event.id}`),
    [F.zohoBilling]: invoiceStatusToAirtable(m.invoiceStatus),
  };

  if (m.weightKg != null && m.weightKg !== "") {
    const w = Number(m.weightKg);
    if (Number.isFinite(w)) fields[F.weight] = w;
  }

  const shipped = formatDateForAirtable(m.shippedAt);
  if (shipped) fields[F.shippedDate] = shipped;

  // QR linktree : uniquement si record Paramètres de CETTE base (sinon 422).
  // Ne pas pousser l’ID de l’ancienne base prod.

  return Object.fromEntries(Object.entries(fields).filter(([, v]) => v != null && v !== ""));
}

/** Commande + colis → champs table Colis. */
function orderParcelToColisFields({ order, parcel, user }) {
  const recipient = splitName(user?.name);
  const invoice = order.invoices?.[0];
  const F = COLIS_FIELDS;

  const fields = {
    [F.orderStatus]: parcelStatusToAirtable(parcel?.status || order.status),
    [F.brand]: user?.name || user?.email || null,
    [F.inboundTracking]: order.trackingNumber || null,
    [F.lastName]: recipient.last || null,
    [F.firstName]: recipient.first || null,
    [F.email]: user?.email || null,
    [F.deliveryMode]: transportToAirtable(order.deliveryMode),
    [F.address]: appendLasolutionId("", `order:${order.id}`),
    [F.zohoBilling]: invoice ? invoiceStatusToAirtable(invoice.status) : null,
  };

  if (parcel?.weightKg != null) {
    const w = Number(parcel.weightKg);
    if (Number.isFinite(w)) fields[F.weight] = w;
  }

  const shipped = formatDateForAirtable(parcel?.shippedAt);
  if (shipped) fields[F.shippedDate] = shipped;

  return Object.fromEntries(Object.entries(fields).filter(([, v]) => v != null && v !== ""));
}

module.exports = {
  shippingRequestToColisFields,
  orderParcelToColisFields,
  splitName,
  extractLasolutionId,
  extractLasolutionIdFromFields,
  appendLasolutionId,
  lasolutionIdMarker,
  COLIS_FIELDS,
};
