const { recordWebhook } = require("../webhooks/pspIngest");

function getPrisma() {
  try {
    return require("../db").prisma;
  } catch {
    return null;
  }
}

/**
 * Route montée AVANT express.json() — corps brut requis pour la signature Stripe.
 */
function mountStripeWebhook(app) {
  const express = require("express");

  app.post(
    "/webhooks/psp/stripe",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const buf = req.body;
      const sig = req.headers["stripe-signature"];
      let event;

      if (process.env.STRIPE_WEBHOOK_SECRET) {
        try {
          const Stripe = require("stripe");
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");
          event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
        } catch (err) {
          console.warn("[stripe webhook]", err.message);
          return res.status(400).send(`Webhook Error: ${err.message}`);
        }
      } else {
        try {
          event = JSON.parse(buf.toString("utf8"));
        } catch {
          return res.status(400).json({ error: "JSON invalide." });
        }
      }

      const eventId = event.id || `stripe-${Date.now()}`;
      const prisma = getPrisma();
      try {
        const { duplicate } = await recordWebhook({
          prisma,
          provider: "stripe",
          eventId: String(eventId),
          payload: event,
        });
        res.status(200).json({ received: true, duplicate });
      } catch (e) {
        res.status(500).json({ error: String(e.message || e) });
      }
    }
  );
}

module.exports = { mountStripeWebhook };
