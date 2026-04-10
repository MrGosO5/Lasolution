/**
 * Traitement métier async des webhooks PSP (worker).
 * Étendre par provider (Stripe, Flutterwave, …) avec mapping statuts.
 */
function extractOrderId(payload) {
  if (!payload || typeof payload !== "object") return null;
  const objMeta = payload.data?.object?.metadata;
  const direct =
    payload.metadata?.order_id ||
    payload.metadata?.orderId ||
    objMeta?.order_id ||
    objMeta?.orderId;
  if (direct) return String(direct);
  const nested = JSON.stringify(payload);
  const m = nested.match(/"order_id"\s*:\s*"([^"]+)"/);
  return m ? m[1] : null;
}

function looksLikePaymentSuccess(payload) {
  if (payload?.type === "payment_intent.succeeded" || payload?.type === "charge.succeeded") {
    return true;
  }
  const s = JSON.stringify(payload).toLowerCase();
  return (
    s.includes("succeeded") ||
    s.includes("payment_intent.succeeded") ||
    s.includes("charge.succeeded") ||
    s.includes("successful")
  );
}

async function processWebhookPayload(prisma, eventRow) {
  const payload = eventRow.payload;
  const orderId = extractOrderId(payload);
  if (orderId && looksLikePaymentSuccess(payload)) {
    await prisma.order.updateMany({
      where: { id: orderId, status: { not: "PAID" } },
      data: { status: "PAID" },
    });
  }
}

module.exports = { processWebhookPayload, extractOrderId, looksLikePaymentSuccess };
