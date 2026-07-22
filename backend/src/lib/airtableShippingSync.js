const { pushToAirtable } = require("../integrations/integrationService");

async function syncShippingRequestAirtable(prisma, event, clientEmail) {
  try {
    const result = await pushToAirtable(prisma, {
      entityType: "SHIPPING_REQUEST",
      entityId: event.id,
      clientEmail: clientEmail || event.email,
    });
    if (result.event) return result.event;
    if (result.skipped) return event;
    if (!result.ok) {
      const nextMeta = {
        ...(event.meta || {}),
        lastAirtableError: result.error || result.reason || "Sync Airtable échouée",
      };
      await prisma.securityEvent.update({
        where: { id: event.id },
        data: { meta: nextMeta },
      });
      return { ...event, meta: nextMeta };
    }
    return event;
  } catch (e) {
    console.warn("[airtable] push shipping:", e?.message || e);
    const nextMeta = {
      ...(event.meta || {}),
      lastAirtableError: String(e.message || e).slice(0, 500),
    };
    await prisma.securityEvent.update({
      where: { id: event.id },
      data: { meta: nextMeta },
    });
    return { ...event, meta: nextMeta };
  }
}

module.exports = { syncShippingRequestAirtable };
