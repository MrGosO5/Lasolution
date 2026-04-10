/**
 * Idempotence webhook PSP — en production : persister via Prisma WebhookEvent + queue.
 * Ici : mémoire process pour dev sans DB.
 */
const processed = new Map();

function makeKey(provider, eventId) {
  return `${provider}:${eventId}`;
}

async function recordWebhook({ prisma, provider, eventId, payload }) {
  const key = makeKey(provider, eventId);
  if (processed.has(key)) {
    return { duplicate: true, key };
  }
  if (prisma) {
    try {
      await prisma.webhookEvent.create({
        data: {
          provider,
          eventId,
          payload: payload || {},
          processedAt: null,
        },
      });
    } catch (e) {
      if (e.code === "P2002") {
        return { duplicate: true, key };
      }
      throw e;
    }
  } else {
    processed.set(key, true);
  }
  return { duplicate: false, key };
}

module.exports = { recordWebhook };
