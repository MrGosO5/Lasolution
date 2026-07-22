const { listColisModifiedSince, isAirtableConfigured, getColisRecord } = require("./client");
const { extractLasolutionId, extractLasolutionIdFromFields } = require("./colisMapper");
const { pullShippingRequestFromAirtable } = require("./syncShippingRequest");
const { applyAirtableToOrder } = require("./syncOrder");

let lastPullAt = null;

async function runAirtablePullBatch(prisma) {
  if (!isAirtableConfigured() || !prisma) return { pulled: 0 };

  const since = lastPullAt || new Date(Date.now() - 300_000).toISOString();
  const records = await listColisModifiedSince(since);
  lastPullAt = new Date().toISOString();

  let pulled = 0;

  for (const record of records) {
    const lasolId =
      extractLasolutionId(record.adminNotes) || extractLasolutionIdFromFields(record.fields);

    if (!lasolId) continue;

    if (lasolId.startsWith("ship:")) {
      const eventId = lasolId.slice(5);
      const event = await prisma.securityEvent.findFirst({
        where: { id: eventId, type: "shipping_request" },
      });
      if (!event) continue;
      const meta = event.meta || {};
      if (meta.syncSource === "app") {
        const at = meta.airtableLastSyncedAt || meta.updatedAt;
        if (at && Date.now() - new Date(at).getTime() < 120_000) continue;
      }
      const result = await pullShippingRequestFromAirtable(meta);
      if (result.ok && result.meta) {
        await prisma.securityEvent.update({
          where: { id: eventId },
          data: { meta: result.meta },
        });
        pulled += 1;
      }
    } else if (lasolId.startsWith("order:")) {
      const orderId = lasolId.slice(6);
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { parcels: { take: 1, orderBy: { createdAt: "asc" } } },
      });
      if (!order) continue;
      if (order.airtableSyncSource === "app" && order.airtableLastSyncedAt) {
        const elapsed = Date.now() - new Date(order.airtableLastSyncedAt).getTime();
        if (elapsed < 120_000) continue;
      }
      const parcel = order.parcels[0];
      if (!parcel) continue;
      const fresh = await getColisRecord(record.id);
      const { orderPatch, parcelPatch } = applyAirtableToOrder(order, parcel, fresh);
      await prisma.$transaction([
        prisma.order.update({ where: { id: orderId }, data: orderPatch }),
        prisma.parcel.update({ where: { id: parcel.id }, data: parcelPatch }),
      ]);
      pulled += 1;
    }
  }

  if (pulled > 0) {
    console.log(`[worker] Airtable pull: ${pulled} enregistrement(s)`);
  }
  return { pulled };
}

module.exports = { runAirtablePullBatch };
