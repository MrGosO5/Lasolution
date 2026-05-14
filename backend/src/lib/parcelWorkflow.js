/** Rangs pour n’avancer la commande que vers le « haut » (docs/state-machines.md). */
const ORDER_STATUS_RANK = {
  CREATED: 5,
  AWAITING_PAYMENT: 10,
  PAID: 20,
  WAREHOUSE_RECEIVED: 30,
  WEIGHT_CAPTURED: 40,
  INVOICE_DRAFT: 50,
  INVOICE_APPROVED: 60,
  READY_TO_SHIP: 70,
  SHIPPED: 80,
  OUT_FOR_DELIVERY: 85,
  DELIVERED: 100,
  CANCELLED: -1,
};

function orderRank(status) {
  const u = String(status || "").toUpperCase();
  return ORDER_STATUS_RANK[u] ?? 0;
}

function parseOptionalDate(raw) {
  if (raw == null || raw === "") return new Date();
  const d = new Date(String(raw));
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

/**
 * Met à jour Order.status quand tous les colis atteignent un palier (réception, poids, expédition).
 * Ne rétrograde jamais ; ignore AWAITING_PAYMENT / CANCELLED / DELIVERED.
 */
async function syncOrderStatusFromParcels(tx, orderId, actorId) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { parcels: true },
  });
  if (!order?.parcels?.length) return null;

  const cur = String(order.status || "").toUpperCase();
  if (cur === "CANCELLED" || cur === "DELIVERED" || cur === "AWAITING_PAYMENT") return null;

  const parcels = order.parcels;
  const allReceived = parcels.every((p) => p.receivedAt != null);
  const allWeighed = parcels.every((p) => {
    const w = p.weightKg;
    if (w == null) return false;
    const n = Number(w);
    return Number.isFinite(n) && n > 0;
  });
  const allShipped = parcels.every((p) => p.shippedAt != null);

  let suggested = null;
  if (allShipped) suggested = "SHIPPED";
  else if (allWeighed && allReceived) suggested = "WEIGHT_CAPTURED";
  else if (allReceived) suggested = "WAREHOUSE_RECEIVED";

  if (!suggested) return null;
  if (orderRank(suggested) <= orderRank(cur)) return null;

  const updated = await tx.order.update({
    where: { id: orderId },
    data: { status: suggested },
  });

  await tx.auditLog.create({
    data: {
      actorId: actorId || null,
      action: "order.status.sync_from_parcels",
      entityType: "Order",
      entityId: orderId,
      before: { status: cur },
      after: { status: suggested },
    },
  });

  return updated;
}

module.exports = {
  ORDER_STATUS_RANK,
  orderRank,
  parseOptionalDate,
  syncOrderStatusFromParcels,
};
