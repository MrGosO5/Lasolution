const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config();

const { prisma } = require("./db");
const { processWebhookPayload } = require("./webhooks/processWebhook");
const { runAirtablePullBatch } = require("./integrations/airtable/pullWorker");
const { airtableConfig } = require("./integrations/integrationsConfig");

const INTERVAL_MS = parseInt(process.env.WORKER_POLL_MS || "4000", 10);
let lastAirtablePullAt = 0;

async function processBatch() {
  const batch = await prisma.webhookEvent.findMany({
    where: {
      processedAt: null,
      error: null,
    },
    take: 25,
    orderBy: { id: "asc" },
  });

  for (const ev of batch) {
    try {
      await processWebhookPayload(prisma, ev);
      await prisma.webhookEvent.update({
        where: { id: ev.id },
        data: { processedAt: new Date(), error: null },
      });
    } catch (e) {
      await prisma.webhookEvent.update({
        where: { id: ev.id },
        data: { error: String(e.message || e).slice(0, 2000) },
      });
    }
  }

  if (batch.length > 0) {
    console.log(`[worker] traité ${batch.length} webhook(s)`);
  }
}

async function maybeAirtablePull() {
  const cfg = airtableConfig();
  if (!cfg.pullEnabled) return;
  const now = Date.now();
  if (now - lastAirtablePullAt < cfg.pullIntervalMs) return;
  lastAirtablePullAt = now;
  try {
    await runAirtablePullBatch(prisma);
  } catch (e) {
    console.error("[worker] Airtable pull:", e?.message || e);
  }
}

async function main() {
  const pullOn = airtableConfig().pullEnabled;
  console.log(
    `[worker] Lasolution worker démarré (webhooks PSP${pullOn ? " + Airtable pull" : ""}).`,
  );
  for (;;) {
    try {
      await processBatch();
      await maybeAirtablePull();
    } catch (e) {
      console.error("[worker]", e);
    }
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
  }
}

main();
