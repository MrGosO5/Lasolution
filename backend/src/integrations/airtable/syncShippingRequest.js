/**
 * Push Airtable pour expéditions — tracking app = source de vérité.
 */
const {
  createColisRecord,
  getColisRecord,
  updateColisRecord,
  isAirtableConfigured,
} = require("./client");
const { shippingRequestToColisFields } = require("./colisMapper");
const { airtableStatusToApp } = require("./statusMap");
const { airtableConfig } = require("../integrationsConfig");
const { resolveLasolTrackingFromMeta } = require("../../lib/airtableTracking");

async function pushShippingRequestToAirtable(event, clientEmail, airtableRecordIdHint) {
  if (!isAirtableConfigured()) {
    return { ok: false, skipped: true, reason: "Airtable non configuré", code: "AIRTABLE_NOT_CONFIGURED" };
  }

  const meta = event.meta || {};
  const appTracking = resolveLasolTrackingFromMeta(meta, event.id);
  const fields = shippingRequestToColisFields({
    event,
    meta: { ...meta, trackingNumber: appTracking, labelTrackingNumber: appTracking },
    clientEmail: clientEmail || event.email,
  });

  const existingId = airtableRecordIdHint || meta.airtableRecordId;
  let record;
  if (existingId) {
    record = await updateColisRecord(existingId, fields);
  } else {
    record = await createColisRecord(fields);
  }

  // OrderID autonumber peut nécessiter une relecture ; le tracking reste celui de l’app.
  let orderId = record.orderId;
  if (orderId == null) {
    try {
      const fresh = await getColisRecord(record.id);
      orderId = fresh.orderId;
    } catch {
      /* ignore */
    }
  }

  const now = new Date().toISOString();
  return {
    ok: true,
    airtableRecordId: record.id,
    airtableOrderId: orderId,
    trackingNumber: appTracking,
    airtableLastSyncedAt: now,
    syncSource: "app",
    lastSyncError: null,
  };
}

function shouldSkipPull(metaOrLink) {
  const cfg = airtableConfig();
  const source = metaOrLink?.syncSource;
  if (source !== "app" && source !== "APP") return false;
  const at = metaOrLink?.airtableLastSyncedAt || metaOrLink?.lastSyncedAt || metaOrLink?.updatedAt;
  if (!at) return false;
  const elapsed = Date.now() - new Date(at).getTime();
  return elapsed < cfg.antiLoopMs;
}

function applyAirtableRecordToMeta(meta, record) {
  const next = { ...(meta || {}) };
  const statusCode = airtableStatusToApp(record.orderStatus);
  if (statusCode) next.status = statusCode;
  if (record.weightKg != null && record.weightKg !== "") {
    next.weightKg = String(record.weightKg);
  }
  if (record.shippedAt) {
    next.shippedAt = new Date(record.shippedAt).toISOString();
  }
  if (record.adminNotes != null) {
    next.adminNotes = String(record.adminNotes).slice(0, 4000);
  }
  // Tracking : source de vérité = app — ne pas écraser avec la formule Airtable.
  next.airtableRecordId = record.id;
  if (record.orderId != null) next.airtableOrderId = record.orderId;
  next.airtableLastSyncedAt = new Date().toISOString();
  next.syncSource = "airtable";
  next.updatedAt = new Date().toISOString();
  return next;
}

async function pullShippingRequestFromAirtable(meta, airtableRecordIdHint) {
  const recordId = airtableRecordIdHint || meta?.airtableRecordId;
  if (!isAirtableConfigured() || !recordId) {
    return { ok: false, skipped: true };
  }
  if (shouldSkipPull(meta)) {
    return { ok: false, skipped: true, reason: "anti-loop" };
  }

  const record = await getColisRecord(recordId);
  return { ok: true, meta: applyAirtableRecordToMeta(meta, record) };
}

module.exports = {
  pushShippingRequestToAirtable,
  pullShippingRequestFromAirtable,
  applyAirtableRecordToMeta,
  shouldSkipPull,
};
