/**
 * Push commande → Airtable. Tracking généré par l’app.
 */
const {
  createColisRecord,
  getColisRecord,
  updateColisRecord,
  isAirtableConfigured,
} = require("./client");
const { orderParcelToColisFields } = require("./colisMapper");
const { airtableStatusToApp } = require("./statusMap");
const { shouldSkipPull } = require("./syncShippingRequest");
const { formatAirtableTrackingNumber } = require("../../lib/airtableTracking");

async function pushOrderToAirtable({ order, parcel, user }) {
  if (!isAirtableConfigured()) {
    return { ok: false, skipped: true, reason: "Airtable non configuré", code: "AIRTABLE_NOT_CONFIGURED" };
  }

  const appTracking = formatAirtableTrackingNumber(order.id);
  const fields = orderParcelToColisFields({
    order: { ...order, trackingNumber: appTracking },
    parcel,
    user,
  });
  let record;

  if (order.airtableRecordId) {
    record = await updateColisRecord(order.airtableRecordId, fields);
  } else {
    record = await createColisRecord(fields);
  }

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
    airtableSyncSource: "app",
    lastSyncError: null,
  };
}

function applyAirtableToOrder(order, parcel, record) {
  const statusCode = airtableStatusToApp(record.orderStatus);
  const parcelPatch = {};
  if (statusCode) {
    const parcelMap = {
      IN_TRANSIT: "SHIPPED",
      DELIVERED: "DELIVERED",
      RECEIVED_AT_WAREHOUSE: "WAREHOUSE_RECEIVED",
      AWAITING_RECEPTION: "PENDING",
    };
    parcelPatch.status = parcelMap[statusCode] || parcel.status;
  }
  if (record.weightKg != null) {
    parcelPatch.weightKg = record.weightKg;
  }
  if (record.shippedAt) {
    parcelPatch.shippedAt = new Date(record.shippedAt);
  }

  return {
    orderPatch: {
      airtableRecordId: record.id,
      airtableOrderId: record.orderId != null ? Number(record.orderId) : null,
      airtableLastSyncedAt: new Date(),
      airtableSyncSource: "airtable",
    },
    parcelPatch,
  };
}

async function pullOrderFromAirtable(order, parcel) {
  if (!isAirtableConfigured() || !order.airtableRecordId) {
    return { ok: false, skipped: true };
  }
  if (shouldSkipPull({ syncSource: order.airtableSyncSource, airtableLastSyncedAt: order.airtableLastSyncedAt })) {
    return { ok: false, skipped: true, reason: "anti-loop" };
  }

  const record = await getColisRecord(order.airtableRecordId);
  const patches = applyAirtableToOrder(order, parcel, record);
  return { ok: true, ...patches };
}

module.exports = {
  pushOrderToAirtable,
  pullOrderFromAirtable,
  applyAirtableToOrder,
};
