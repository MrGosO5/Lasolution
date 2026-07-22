const path = require("path");
const fs = require("fs");
const { createDraftInvoice, approveInvoice } = require("../integrations/zohoBooks");
const { CarrierAdapter } = require("../carriers/adapter");
const {
  formatAirtableTrackingNumber,
  isLasolTrackingNumber,
  normalizeLasolTrackingNumber,
  resolveLasolTrackingFromMeta,
} = require("./airtableTracking");


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

function estimateShippingInvoiceAmountEur(weightKg, transportMode) {
  const w = Number(weightKg);
  if (!Number.isFinite(w) || w <= 0) return null;
  const mode = String(transportMode || "SEA").toUpperCase();
  if (mode === "AIR") return Math.max(25, Math.round(w * 15 * 100) / 100);
  return Math.max(15, Math.round(w * 8 * 100) / 100);
}

/** Numéro La Solution — toujours généré par l’app (immuable, déterministe). */
function resolveLasolTracking(meta, eventId) {
  return resolveLasolTrackingFromMeta(meta, eventId);
}

function withLasolTracking(meta, eventId) {
  const lasol = resolveLasolTracking(meta, eventId);
  if (!lasol) return { ...meta };
  return {
    ...meta,
    labelTrackingNumber: lasol,
    trackingNumber: lasol,
  };
}

function invoiceLinesForMeta(meta, eventId) {
  const amount = estimateShippingInvoiceAmountEur(meta.weightKg, meta.transportMode);
  const tracking = resolveLasolTracking(meta, eventId) || "—";
  const transportLabel = meta.transportMode === "AIR" ? "aérienne" : "maritime";
  const label =
    amount != null
      ? `Expédition ${transportLabel} — ${meta.weightKg} kg (${tracking})`
      : `Expédition ${transportLabel} — ${tracking}`;
  return [{ label, amount: amount ?? 0 }];
}

async function attachZohoDraft(meta, eventId, customer = {}) {
  const withTracking = withLasolTracking(meta, eventId);
  const zoho = await createDraftInvoice({
    orderId: `shipping_${eventId}`,
    lines: invoiceLinesForMeta(withTracking, eventId),
    customer: {
      email: customer.email || meta.clientEmail || meta.email,
      name: customer.name || meta.senderName || meta.recipientName,
      phone: customer.phone || meta.senderPhone,
    },
  });
  const amount = estimateShippingInvoiceAmountEur(withTracking.weightKg, withTracking.transportMode);
  const failed = zoho.zohoSyncStatus === "FAILED" || zoho.ok === false;
  return {
    ...withTracking,
    ...defaultOpsMeta(),
    zohoDraftId: zoho.zohoDraftId || withTracking.zohoDraftId || null,
    zohoContactId: zoho.zohoContactId || null,
    invoiceStatus: failed ? withTracking.invoiceStatus || "DRAFT" : "DRAFT",
    invoiceAmountEur: amount,
    zohoSyncStatus: zoho.zohoSyncStatus || "DRAFT",
    lastSyncError: zoho.lastSyncError || null,
  };
}

async function ensureZohoDraftForMeta(meta, eventId) {
  const withTracking = withLasolTracking(meta, eventId);
  const amount = estimateShippingInvoiceAmountEur(withTracking.weightKg, withTracking.transportMode);
  if (!amount) return withTracking;

  const prevAmount =
    withTracking.invoiceAmountEur != null ? Number(withTracking.invoiceAmountEur) : null;
  if (withTracking.zohoDraftId && prevAmount === amount) return withTracking;

  const zoho = await createDraftInvoice({
    orderId: `shipping_${eventId}`,
    lines: invoiceLinesForMeta(withTracking, eventId),
    customer: {
      email: withTracking.clientEmail || withTracking.email,
      name: withTracking.senderName || withTracking.recipientName,
      phone: withTracking.senderPhone,
    },
  });
  return {
    ...withTracking,
    zohoDraftId: zoho.zohoDraftId,
    zohoContactId: zoho.zohoContactId || withTracking.zohoContactId || null,
    invoiceStatus: withTracking.invoiceStatus === "APPROVED" ? withTracking.invoiceStatus : "DRAFT",
    invoiceAmountEur: amount,
    zohoSyncStatus: zoho.zohoSyncStatus || "DRAFT",
    lastSyncError: zoho.lastSyncError || null,
    updatedAt: new Date().toISOString(),
  };
}

function mergeEditableMeta(existing, patch, eventId) {
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
  if (
    eventId &&
    patch.trackingNumber !== undefined &&
    patch.trackingNumber != null &&
    patch.trackingNumber !== ""
  ) {
    const lasol = normalizeLasolTrackingNumber(patch.trackingNumber, eventId);
    next.labelTrackingNumber = lasol;
    next.trackingNumber = lasol;
  }
  next.updatedAt = new Date().toISOString();
  return next;
}

async function approveZohoForMeta(meta, eventId) {
  let working = eventId ? withLasolTracking(meta, eventId) : meta;
  if (!working.zohoDraftId && eventId) {
    working = await ensureZohoDraftForMeta(working, eventId);
  }
  if (!working.zohoDraftId) {
    const created = await createDraftInvoice({
      orderId: eventId ? `shipping_${eventId}` : `shipping_regen_${Date.now()}`,
      lines: eventId ? invoiceLinesForMeta(working, eventId) : [{ label: "Expédition", amount: 0 }],
    });
    working = { ...working, zohoDraftId: created.zohoDraftId };
  }
  meta = working;
  const approved = await approveInvoice({ zohoDraftId: meta.zohoDraftId });
  const nextStatus = meta.status === "INVOICE_DRAFT" ? "INVOICE_APPROVED" : meta.status;
  return {
    ...meta,
    zohoInvoiceId: approved.zohoInvoiceId,
    invoiceStatus: "APPROVED",
    zohoSyncStatus: approved.zohoSyncStatus || approved.status || "SENT",
    lastSyncError: approved.lastSyncError || null,
    status: nextStatus,
    statusHistory:
      nextStatus !== meta.status ? pushStatusHistory(meta, nextStatus) : meta.statusHistory,
    updatedAt: new Date().toISOString(),
  };
}

async function generateLabelForMeta(meta, eventId) {
  const tracking = resolveLasolTracking(meta, eventId);
  const adapter = new CarrierAdapter(process.env.CARRIER_NAME || "stub");
  const out = await adapter.createShipment({
    parcelId: eventId,
    trackingNumber: tracking,
    weightKg: meta.weightKg ? Number(meta.weightKg) : undefined,
    toAddress: {
      name: meta.recipientName,
      phone: meta.recipientPhone,
      line1: meta.destinationAddress,
      country: meta.destinationCountry,
    },
  });
  const qrPayload = process.env.LINKTREE_URL || "https://linktr.ee/LaSolution";
  return {
    ...meta,
    labelTrackingNumber: tracking,
    labelUrl: out.labelUrl,
    labelQrPayload: out.qrPayload || qrPayload,
    labelCarrier: out.carrier,
    trackingNumber: tracking,
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

function sanitizeMetaForClient(meta, eventId) {
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
  const tracking = eventId ? resolveLasolTracking(m, eventId) : m.labelTrackingNumber || m.trackingNumber || null;
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

function mergeAirtableSyncIntoMeta(meta, syncResult) {
  if (!syncResult?.ok) {
    return {
      ...meta,
      lastAirtableError: syncResult?.reason || syncResult?.error || "Sync Airtable ignorée",
    };
  }
  return {
    ...meta,
    airtableRecordId: syncResult.airtableRecordId,
    airtableOrderId: syncResult.airtableOrderId,
    airtableLastSyncedAt: syncResult.airtableLastSyncedAt,
    syncSource: syncResult.syncSource || "app",
    lastAirtableError: null,
    ...(syncResult.trackingNumber
      ? {
          labelTrackingNumber: syncResult.trackingNumber,
          trackingNumber: syncResult.trackingNumber,
        }
      : {}),
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
  estimateShippingInvoiceAmountEur,
  resolveLasolTracking,
  withLasolTracking,
  attachZohoDraft,
  ensureZohoDraftForMeta,
  mergeEditableMeta,
  approveZohoForMeta,
  generateLabelForMeta,
  appendCommunication,
  sanitizeMetaForClient,
  pushStatusHistory,
  mergeAirtableSyncIntoMeta,
};
