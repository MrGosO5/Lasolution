/**
 * Façade sync — les routes n’appellent pas Zoho/Airtable directement.
 */
const { isAirtableConfigured, isZohoConfigured } = require("./integrationsConfig");
const { pushShippingRequestToAirtable } = require("./airtable/syncShippingRequest");
const { pushOrderToAirtable } = require("./airtable/syncOrder");
const {
  getLink,
  getLinks,
  markAttempt,
  markSynced,
  markFailed,
  serializeLink,
} = require("../lib/integrationLink");
const {
  ensureOrderInvoiceDraft,
  approveOrderInvoice,
} = require("../lib/orderZoho");
const {
  attachZohoDraft,
  ensureZohoDraftForMeta,
  approveZohoForMeta,
  mergeAirtableSyncIntoMeta,
} = require("../lib/shippingRequestOps");

async function getIntegration(prisma, { entityType, entityId, provider }) {
  if (provider) {
    return serializeLink(await getLink(prisma, { entityType, entityId, provider }));
  }
  const links = await getLinks(prisma, { entityType, entityId });
  return links.map(serializeLink);
}

async function pushToAirtable(prisma, { entityType, entityId, clientEmail }) {
  if (!isAirtableConfigured()) {
    return { ok: false, skipped: true, code: "AIRTABLE_NOT_CONFIGURED", reason: "Airtable non configuré" };
  }

  await markAttempt(prisma, { entityType, entityId, provider: "AIRTABLE" });

  try {
    if (entityType === "SHIPPING_REQUEST") {
      const event = await prisma.securityEvent.findFirst({
        where: { id: entityId, type: "shipping_request" },
      });
      if (!event) {
        await markFailed(prisma, {
          entityType,
          entityId,
          provider: "AIRTABLE",
          code: "ENTITY_NOT_FOUND",
          message: "Expédition introuvable",
        });
        return { ok: false, code: "ENTITY_NOT_FOUND", error: "Expédition introuvable" };
      }

      const existing = await getLink(prisma, { entityType, entityId, provider: "AIRTABLE" });
      const sync = await pushShippingRequestToAirtable(
        event,
        clientEmail || event.email,
        existing?.externalId && existing.externalId !== "pending" && existing.externalId !== "failed"
          ? existing.externalId
          : null,
      );

      if (!sync.ok) {
        await markFailed(prisma, {
          entityType,
          entityId,
          provider: "AIRTABLE",
          code: sync.code || "AIRTABLE_PUSH_FAILED",
          message: sync.reason || sync.error || "Échec push Airtable",
        });
        return sync;
      }

      const link = await markSynced(prisma, {
        entityType,
        entityId,
        provider: "AIRTABLE",
        externalId: sync.airtableRecordId,
        status: "SYNCED",
        meta: { airtableOrderId: sync.airtableOrderId },
        syncSource: "APP",
      });

      const nextMeta = mergeAirtableSyncIntoMeta(event.meta || {}, sync);
      const updated = await prisma.securityEvent.update({
        where: { id: entityId },
        data: { meta: nextMeta },
        select: { id: true, email: true, userId: true, createdAt: true, meta: true },
      });

      return { ok: true, event: updated, link: serializeLink(link), trackingNumber: sync.trackingNumber };
    }

    if (entityType === "ORDER") {
      const order = await prisma.order.findUnique({
        where: { id: entityId },
        include: {
          user: { select: { id: true, email: true, name: true } },
          parcels: { take: 1, orderBy: { createdAt: "asc" } },
          invoices: { take: 1, orderBy: { createdAt: "desc" } },
        },
      });
      if (!order) {
        await markFailed(prisma, {
          entityType,
          entityId,
          provider: "AIRTABLE",
          code: "ENTITY_NOT_FOUND",
          message: "Commande introuvable",
        });
        return { ok: false, code: "ENTITY_NOT_FOUND", error: "Commande introuvable" };
      }
      const parcel = order.parcels[0];
      if (!parcel) {
        await markFailed(prisma, {
          entityType,
          entityId,
          provider: "AIRTABLE",
          code: "NO_PARCEL",
          message: "Aucun colis",
        });
        return { ok: false, code: "NO_PARCEL", error: "Aucun colis" };
      }

      const existing = await getLink(prisma, { entityType, entityId, provider: "AIRTABLE" });
      const orderForPush = {
        ...order,
        airtableRecordId:
          existing?.externalId && !["pending", "failed"].includes(existing.externalId)
            ? existing.externalId
            : order.airtableRecordId,
      };

      const sync = await pushOrderToAirtable({ order: orderForPush, parcel, user: order.user });
      if (!sync.ok) {
        await markFailed(prisma, {
          entityType,
          entityId,
          provider: "AIRTABLE",
          code: sync.code || "AIRTABLE_PUSH_FAILED",
          message: sync.reason || sync.error || "Échec push Airtable",
        });
        if (sync.skipped) return sync;
        await prisma.order.update({
          where: { id: entityId },
          data: { lastAirtableError: sync.reason || sync.error || "Échec" },
        });
        return sync;
      }

      const link = await markSynced(prisma, {
        entityType,
        entityId,
        provider: "AIRTABLE",
        externalId: sync.airtableRecordId,
        status: "SYNCED",
        meta: { airtableOrderId: sync.airtableOrderId },
        syncSource: "APP",
      });

      const updated = await prisma.order.update({
        where: { id: entityId },
        data: {
          airtableRecordId: sync.airtableRecordId,
          airtableOrderId: sync.airtableOrderId,
          airtableLastSyncedAt: new Date(sync.airtableLastSyncedAt),
          airtableSyncSource: "app",
          lastAirtableError: null,
        },
        include: {
          user: { select: { id: true, email: true, name: true } },
          parcels: { take: 1, orderBy: { createdAt: "asc" } },
          invoices: { take: 1, orderBy: { createdAt: "desc" } },
        },
      });

      return { ok: true, order: updated, link: serializeLink(link), trackingNumber: sync.trackingNumber };
    }

    return { ok: false, code: "UNSUPPORTED_ENTITY", error: `entityType inconnu: ${entityType}` };
  } catch (e) {
    const msg = String(e.message || e).slice(0, 500);
    await markFailed(prisma, {
      entityType,
      entityId,
      provider: "AIRTABLE",
      code: "AIRTABLE_PUSH_EXCEPTION",
      message: msg,
    });
    if (entityType === "ORDER") {
      await prisma.order.update({ where: { id: entityId }, data: { lastAirtableError: msg } }).catch(() => {});
    }
    return { ok: false, code: "AIRTABLE_PUSH_EXCEPTION", error: msg };
  }
}

async function pushToZoho(prisma, { entityType, entityId, action = "draft", customer }) {
  await markAttempt(prisma, { entityType, entityId, provider: "ZOHO" });

  try {
    if (entityType === "SHIPPING_REQUEST") {
      const event = await prisma.securityEvent.findFirst({
        where: { id: entityId, type: "shipping_request" },
      });
      if (!event) {
        await markFailed(prisma, {
          entityType,
          entityId,
          provider: "ZOHO",
          code: "ENTITY_NOT_FOUND",
          message: "Expédition introuvable",
        });
        return { ok: false, code: "ENTITY_NOT_FOUND", error: "Expédition introuvable" };
      }

      let nextMeta;
      if (action === "approve") {
        nextMeta = await approveZohoForMeta(event.meta || {}, entityId);
      } else if (action === "ensure") {
        nextMeta = await ensureZohoDraftForMeta(event.meta || {}, entityId);
      } else {
        nextMeta = await attachZohoDraft(event.meta || {}, entityId, customer || {});
      }

      const failed = nextMeta.zohoSyncStatus === "FAILED" || nextMeta.lastSyncError;
      if (failed && isZohoConfigured()) {
        await markFailed(prisma, {
          entityType,
          entityId,
          provider: "ZOHO",
          externalId: nextMeta.zohoDraftId || nextMeta.zohoInvoiceId,
          code: "ZOHO_SYNC_FAILED",
          message: nextMeta.lastSyncError || "Échec Zoho",
          meta: { zohoContactId: nextMeta.zohoContactId },
        });
      } else {
        const status =
          nextMeta.invoiceStatus === "APPROVED" || nextMeta.zohoSyncStatus === "SENT"
            ? "SENT"
            : nextMeta.zohoDraftId
              ? "DRAFT"
              : "PENDING";
        await markSynced(prisma, {
          entityType,
          entityId,
          provider: "ZOHO",
          externalId: nextMeta.zohoInvoiceId || nextMeta.zohoDraftId || "pending",
          status,
          meta: { zohoContactId: nextMeta.zohoContactId, zohoDraftId: nextMeta.zohoDraftId },
        });
      }

      const updated = await prisma.securityEvent.update({
        where: { id: entityId },
        data: { meta: nextMeta },
        select: { id: true, email: true, userId: true, createdAt: true, meta: true },
      });
      return { ok: !failed || !isZohoConfigured(), event: updated, meta: nextMeta };
    }

    if (entityType === "ORDER") {
      const order = await prisma.order.findUnique({
        where: { id: entityId },
        include: {
          user: { select: { email: true, name: true } },
          parcels: { take: 1, orderBy: { createdAt: "asc" } },
        },
      });
      if (!order) {
        await markFailed(prisma, {
          entityType,
          entityId,
          provider: "ZOHO",
          code: "ENTITY_NOT_FOUND",
          message: "Commande introuvable",
        });
        return { ok: false, code: "ENTITY_NOT_FOUND", error: "Commande introuvable" };
      }

      let invoice;
      if (action === "approve") {
        invoice = await approveOrderInvoice(prisma, entityId);
      } else {
        const parcel = order.parcels[0];
        const weightKg = parcel?.weightKg != null ? Number(parcel.weightKg) : null;
        if (!weightKg || !Number.isFinite(weightKg)) {
          await markFailed(prisma, {
            entityType,
            entityId,
            provider: "ZOHO",
            code: "WEIGHT_REQUIRED",
            message: "Pesée requise avant facture Zoho",
          });
          return { ok: false, code: "WEIGHT_REQUIRED", error: "Pesée requise avant facture Zoho." };
        }
        invoice = await ensureOrderInvoiceDraft(prisma, entityId, {
          weightKg,
          deliveryMode: order.deliveryMode,
          customer: customer || { email: order.user?.email, name: order.user?.name },
        });
      }

      const failed = invoice?.zohoSyncStatus === "FAILED" || invoice?.lastSyncError;
      if (failed && isZohoConfigured()) {
        await markFailed(prisma, {
          entityType,
          entityId,
          provider: "ZOHO",
          externalId: invoice.zohoDraftId || invoice.zohoInvoiceId,
          code: "ZOHO_SYNC_FAILED",
          message: invoice.lastSyncError || "Échec Zoho",
        });
      } else {
        await markSynced(prisma, {
          entityType,
          entityId,
          provider: "ZOHO",
          externalId: invoice.zohoInvoiceId || invoice.zohoDraftId || "pending",
          status: invoice.status === "SENT" || action === "approve" ? "SENT" : "DRAFT",
        });
      }

      return { ok: !failed || !isZohoConfigured(), invoice };
    }

    return { ok: false, code: "UNSUPPORTED_ENTITY", error: `entityType inconnu: ${entityType}` };
  } catch (e) {
    const msg = String(e.message || e).slice(0, 500);
    await markFailed(prisma, {
      entityType,
      entityId,
      provider: "ZOHO",
      code: "ZOHO_PUSH_EXCEPTION",
      message: msg,
    });
    return { ok: false, code: "ZOHO_PUSH_EXCEPTION", error: msg };
  }
}

module.exports = {
  getIntegration,
  pushToAirtable,
  pushToZoho,
  markFailed,
  markSynced,
};
