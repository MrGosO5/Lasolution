/**
 * Façade PSP — branche Stripe, Flutterwave, Paystack, etc.
 * @see docs/integrations-zoho-psp.md
 */

async function createPaymentIntent({ provider, amount, currency, orderId, idempotencyKey }) {
  const intentId = `${provider}_pi_${idempotencyKey || Date.now()}`;
  return {
    provider,
    clientSecret: `${intentId}_secret_stub`,
    providerIntentId: intentId,
    status: "requires_confirmation",
    amount,
    currency,
    metadata: { orderId, order_id: orderId },
  };
}

module.exports = { createPaymentIntent };
