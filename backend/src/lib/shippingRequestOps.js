const path = require("path");
const fs = require("fs");
const { createDraftInvoice, approveInvoice } = require("../integrations/zohoBooks");
const { CarrierAdapter } = require("../carriers/adapter");

const SHIPPING_STATUSES = [
  "AWAITING_RECEPTION",
  "RECEIVED_AT_WAREHOUSE",
  "IN_TRANSIT",
  "AVAILABLE_FOR_PICKUP",
  "CANCELLED",
  "DELIVERED",
  "WRONG_DELIVERY",
  "DELAYED",
  "RECEIVED_COTONOU",
  "RECEIVED_LIBREVILLE",
  "RECEIVED_LOME",
];

const STATUS_LABELS_FR = {
  AWAITING_RECEPTION: "En attente de réception",
  RECEIVED_AT_WAREHOUSE: "Reçu à l'entrepôt",
  IN_TRANSIT: "En transit",
  AVAILABLE_FOR_PICKUP: "Disponible pour récupération",
  CANCELLED: "Annulé",
  DELIVERED: "Livré",
  WRONG_DELIVERY: "Livraison erronée",
  DELAYED: "Colis retardé",
  RECEIVED_COTONOU: "Reçu à Cotonou",
  RECEIVED_LIBREVILLE: "Reçu à Libreville",
  RECEIVED_LOME: "Reçu à Lomé",
};

/** Anciens codes (affichage uniquement pour données historiques). */
const LEGACY_STATUS_LABELS_FR = {
  SUBMITTED: "En attente de réception",
  IN_REVIEW: "En attente de réception",
  QUOTED: "En attente de réception",
  INVOICE_DRAFT: "En attente de réception",
  INVOICE_APPROVED: "En attente de réception",
  READY_TO_SHIP: "Reçu à l'entrepôt",
  SHIPPED: "En transit",
  OUT_FOR_DELIVERY: "En transit",
};

function statusLabelFr(s) {
  const key = String(s || "").toUpperCase();
  return STATUS_LABELS_FR[key] || LEGACY_STATUS_LABELS_FR[key] || key || STATUS_LABELS_FR.AWAITING_RECEPTION;
}

const EDITABLE_META_KEYS = [
  "transportMode",
  "trackingNumber",
  "senderName",
  "senderPhone",
  "pickupAddress",
  "recipientName",
  "recipientPhone",
  "destinationCountry",
  "destinationAddress",
  "weightKg",
  "notes",
  "adminNotes",
];

function isValidStatus(s) {
  return SHIPPING_STATUSES.includes(String(s || "").toUpperCase());
}

function uploadsRoot() {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
}

function saveShippingPhoto(eventId, photoBuf, photoMime) {
  const ext = String(photoMime || "").includes("png") ? "png" : "jpg";
  const dir = path.join(uploadsRoot(), "shipping-requests");
  fs.mkdirSync(dir, { recursive: true });
  const rel = `shipping-requests/${eventId}.${ext}`;
  fs.writeFileSync(path.join(uploadsRoot(), rel), photoBuf);
  return rel;
}

function resolvePhotoAbs(photoPath) {
  if (!photoPath) return null;
  const rel = String(photoPath).replace(/^\/+/, "");
  const abs = path.join(uploadsRoot(), rel);
  if (!abs.startsWith(uploadsRoot())) return null;
  return fs.existsSync(abs) ? abs : null;
}

function deleteShippingPhoto(photoPath) {
  const abs = resolvePhotoAbs(photoPath);
  if (!abs) return;
  try {
    fs.unlinkSync(abs);
  } catch {
    /* ignore */
  }
}

function pushStatusHistory(existing, status, at = new Date().toISOString()) {
  const history = Array.isArray(existing?.statusHistory) ? [...existing.statusHistory] : [];
  const normalized = String(status).toUpperCase();
  if (history[0]?.status === normalized) return history;
  history.unshift({ status: normalized, at });
  return history.slice(0, 40);
}

function defaultOpsMeta() {
  const at = new Date().toISOString();
  return {
    status: "AWAITING_RECEPTION",
    updatedAt: at,
    communications: [],
    statusHistory: [{ status: "AWAITING_RECEPTION", at }],
  };
}

async function attachZohoDraft(meta, eventId) {
  const zoho = await createDraftInvoice({
    orderId: `shipping_${eventId}`,
    lines: [
      {
        label: `Expédition ${meta.transportMode === "AIR" ? "aérienne" : "maritime"}`,
        amount: 0,
      },
    ],
  });
  return {
    ...meta,
    ...defaultOpsMeta(),
    zohoDraftId: zoho.zohoDraftId,
    invoiceStatus: "DRAFT",
    zohoSyncStatus: "DRAFT_STUB",
  };
}

function mergeEditableMeta(existing, patch) {
  const next = { ...(existing || {}) };
  for (const key of EDITABLE_META_KEYS) {
    if (patch[key] !== undefined) {
      next[key] = patch[key] == null || patch[key] === "" ? null : String(patch[key]).slice(0, key === "notes" || key === "adminNotes" ? 4000 : 500);
    }
  }
  if (patch.transportMode !== undefined) {
    const u = String(patch.transportMode).toUpperCase();
    next.transportMode = u === "AIR" ? "AIR" : "SEA";
  }
  if (patch.status !== undefined && isValidStatus(patch.status)) {
    const nextStatus = String(patch.status).toUpperCase();
    const prevStatus = String(existing?.status || "AWAITING_RECEPTION").toUpperCase();
    if (nextStatus !== prevStatus) {
      next.statusHistory = pushStatusHistory(existing, nextStatus);
    }
    next.status = nextStatus;
  }
  if (patch.shippedAt !== undefined) {
    next.shippedAt = patch.shippedAt ? String(patch.shippedAt) : null;
  }
  next.updatedAt = new Date().toISOString();
  return next;
}

async function approveZohoForMeta(meta) {
  if (!meta.zohoDraftId) {
    const created = await createDraftInvoice({
      orderId: `shipping_regen_${Date.now()}`,
      lines: [{ label: "Expédition", amount: 0 }],
    });
    meta.zohoDraftId = created.zohoDraftId;
  }
  const approved = await approveInvoice({ zohoDraftId: meta.zohoDraftId });
  const nextStatus = meta.status === "INVOICE_DRAFT" ? "INVOICE_APPROVED" : meta.status;
  return {
    ...meta,
    zohoInvoiceId: approved.zohoInvoiceId,
    invoiceStatus: "APPROVED",
    zohoSyncStatus: approved.status || "SENT",
    status: nextStatus,
    statusHistory:
      nextStatus !== meta.status ? pushStatusHistory(meta, nextStatus) : meta.statusHistory,
    updatedAt: new Date().toISOString(),
  };
}

async function generateLabelForMeta(meta, eventId) {
  const adapter = new CarrierAdapter(process.env.CARRIER_NAME || "stub");
  const out = await adapter.createShipment({
    parcelId: eventId,
    weightKg: meta.weightKg ? Number(meta.weightKg) : undefined,
    toAddress: {
      name: meta.recipientName,
      phone: meta.recipientPhone,
      line1: meta.destinationAddress,
      country: meta.destinationCountry,
    },
  });
  return {
    ...meta,
    labelTrackingNumber: out.trackingNumber,
    labelUrl: out.labelUrl,
    labelQrPayload: out.qrPayload,
    labelCarrier: out.carrier,
    trackingNumber: meta.trackingNumber || out.trackingNumber,
    updatedAt: new Date().toISOString(),
  };
}

function appendCommunication(meta, entry) {
  const list = Array.isArray(meta.communications) ? [...meta.communications] : [];
  list.unshift({
    id: `comm_${Date.now()}`,
    sentAt: new Date().toISOString(),
    channel: entry.channel || "email",
    subject: entry.subject,
    message: entry.message,
    to: entry.to,
    ok: entry.ok !== false,
  });
  return { ...meta, communications: list.slice(0, 50), updatedAt: new Date().toISOString() };
}

function sanitizeMetaForClient(meta) {
  if (!meta || typeof meta !== "object") {
    return { status: "AWAITING_RECEPTION", communications: [], statusHistory: [] };
  }
  const m = meta;
  const communications = Array.isArray(m.communications)
    ? m.communications
        .filter((c) => c && (c.subject || c.message))
        .map((c) => ({
          id: String(c.id || `comm_${c.sentAt}`),
          sentAt: String(c.sentAt || ""),
          subject: String(c.subject || "").slice(0, 200),
          message: String(c.message || "").slice(0, 4000),
        }))
    : [];
  const tracking = m.labelTrackingNumber || m.trackingNumber || null;
  return {
    transportMode: m.transportMode ?? null,
    trackingNumber: tracking,
    recipientName: m.recipientName ?? null,
    recipientPhone: m.recipientPhone ?? null,
    destinationCountry: m.destinationCountry ?? null,
    destinationAddress: m.destinationAddress ?? null,
    weightKg: m.weightKg ?? null,
    notes: m.notes ?? null,
    status: m.status || "AWAITING_RECEPTION",
    shippedAt: m.shippedAt ?? null,
    updatedAt: m.updatedAt ?? null,
    statusHistory: Array.isArray(m.statusHistory) ? m.statusHistory : [],
    communications,
  };
}

module.exports = {
  SHIPPING_STATUSES,
  STATUS_LABELS_FR,
  LEGACY_STATUS_LABELS_FR,
  statusLabelFr,
  EDITABLE_META_KEYS,
  isValidStatus,
  saveShippingPhoto,
  resolvePhotoAbs,
  deleteShippingPhoto,
  attachZohoDraft,
  mergeEditableMeta,
  approveZohoForMeta,
  generateLabelForMeta,
  appendCommunication,
  sanitizeMetaForClient,
  pushStatusHistory,
};
