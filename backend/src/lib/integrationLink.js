/**
 * Persistence helpers for IntegrationLink.
 */

async function getLink(prisma, { entityType, entityId, provider }) {
  if (!prisma) return null;
  return prisma.integrationLink.findUnique({
    where: {
      entityType_entityId_provider: { entityType, entityId, provider },
    },
  });
}

async function getLinks(prisma, { entityType, entityId, provider }) {
  if (!prisma) return [];
  const where = { entityType, entityId };
  if (provider) where.provider = provider;
  return prisma.integrationLink.findMany({ where, orderBy: { updatedAt: "desc" } });
}

async function markAttempt(prisma, { entityType, entityId, provider }) {
  const existing = await getLink(prisma, { entityType, entityId, provider });
  const now = new Date();
  if (!existing) {
    return prisma.integrationLink.create({
      data: {
        entityType,
        entityId,
        provider,
        externalId: "pending",
        status: "PENDING",
        lastAttemptAt: now,
        retryCount: 1,
        syncSource: "APP",
      },
    });
  }
  return prisma.integrationLink.update({
    where: { id: existing.id },
    data: {
      lastAttemptAt: now,
      retryCount: (existing.retryCount || 0) + 1,
    },
  });
}

async function markSynced(prisma, {
  entityType,
  entityId,
  provider,
  externalId,
  status = "SYNCED",
  meta,
  syncSource = "APP",
}) {
  const existing = await getLink(prisma, { entityType, entityId, provider });
  const now = new Date();
  const data = {
    externalId: String(externalId),
    status,
    lastSyncedAt: now,
    lastAttemptAt: now,
    lastErrorCode: null,
    lastErrorMessage: null,
    syncSource,
    ...(meta !== undefined ? { meta } : {}),
  };

  if (!existing) {
    return prisma.integrationLink.create({
      data: {
        entityType,
        entityId,
        provider,
        retryCount: 1,
        ...data,
      },
    });
  }

  return prisma.integrationLink.update({
    where: { id: existing.id },
    data: {
      ...data,
      retryCount: (existing.retryCount || 0) + 1,
    },
  });
}

async function markFailed(prisma, {
  entityType,
  entityId,
  provider,
  externalId,
  code,
  message,
  meta,
}) {
  const existing = await getLink(prisma, { entityType, entityId, provider });
  const now = new Date();
  const data = {
    status: "FAILED",
    lastAttemptAt: now,
    lastErrorCode: String(code || "INTEGRATION_ERROR").slice(0, 120),
    lastErrorMessage: String(message || "Erreur").slice(0, 2000),
    ...(externalId ? { externalId: String(externalId) } : {}),
    ...(meta !== undefined ? { meta } : {}),
  };

  if (!existing) {
    return prisma.integrationLink.create({
      data: {
        entityType,
        entityId,
        provider,
        externalId: externalId ? String(externalId) : "failed",
        retryCount: 1,
        syncSource: "APP",
        ...data,
      },
    });
  }

  return prisma.integrationLink.update({
    where: { id: existing.id },
    data: {
      ...data,
      retryCount: (existing.retryCount || 0) + 1,
    },
  });
}

function serializeLink(link) {
  if (!link) return null;
  return {
    id: link.id,
    entityType: link.entityType,
    entityId: link.entityId,
    provider: link.provider,
    externalId: link.externalId,
    status: link.status,
    lastSyncedAt: link.lastSyncedAt,
    lastErrorCode: link.lastErrorCode,
    lastErrorMessage: link.lastErrorMessage,
    lastAttemptAt: link.lastAttemptAt,
    retryCount: link.retryCount,
    syncSource: link.syncSource,
    meta: link.meta,
    createdAt: link.createdAt,
    updatedAt: link.updatedAt,
  };
}

module.exports = {
  getLink,
  getLinks,
  markAttempt,
  markSynced,
  markFailed,
  serializeLink,
};
