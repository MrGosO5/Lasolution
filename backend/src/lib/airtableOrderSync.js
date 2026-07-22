const { pushToAirtable } = require("../integrations/integrationService");

async function syncOrderAirtable(prisma, orderId) {
  const result = await pushToAirtable(prisma, {
    entityType: "ORDER",
    entityId: orderId,
  });
  if (result.ok) {
    return { ok: true, order: result.order, trackingNumber: result.trackingNumber };
  }
  return {
    ok: false,
    skipped: result.skipped,
    reason: result.reason || result.error,
    error: result.error || result.reason,
    code: result.code,
  };
}

module.exports = { syncOrderAirtable };
