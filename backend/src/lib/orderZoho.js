const { createDraftInvoice, approveInvoice } = require("../integrations/zohoBooks");
const { Prisma } = require("@prisma/client");

const TAX_RATE = Number(process.env.ZOHO_INVOICE_TAX_RATE || "20");

function estimateOrderShippingEur(weightKg, deliveryMode) {
  const w = Number(weightKg);
  if (!Number.isFinite(w) || w <= 0) return null;
  const mode = String(deliveryMode || "SEA").toUpperCase();
  if (mode === "AIR") return Math.max(25, Math.round(w * 15 * 100) / 100);
  return Math.max(15, Math.round(w * 8 * 100) / 100);
}

async function ensureOrderInvoiceDraft(prisma, orderId, { weightKg, deliveryMode, customer }) {
  const amount = estimateOrderShippingEur(weightKg, deliveryMode);
  if (!amount) return null;

  let invoice = await prisma.invoice.findFirst({
    where: { orderId },
    orderBy: { createdAt: "desc" },
  });

  if (!invoice) {
    invoice = await prisma.invoice.create({
      data: {
        orderId,
        status: "DRAFT",
        currency: "EUR",
        lines: {
          create: [
            {
              label: `Frais d'expédition — ${weightKg} kg`,
              amount: new Prisma.Decimal(String(amount)),
              taxRate: new Prisma.Decimal(String(TAX_RATE)),
            },
          ],
        },
      },
      include: { lines: true },
    });
  }

  if (invoice.zohoDraftId && invoice.zohoSyncStatus !== "FAILED") {
    return invoice;
  }

  const zoho = await createDraftInvoice({
    orderId,
    lines: invoice.lines.map((l) => ({
      label: l.label,
      amount: Number(l.amount),
    })),
    customer,
  });

  return prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      zohoDraftId: zoho.zohoDraftId,
      zohoInvoiceId: zoho.zohoInvoiceId || invoice.zohoInvoiceId,
      zohoSyncStatus: zoho.zohoSyncStatus || "DRAFT",
      lastSyncError: zoho.lastSyncError || null,
      status: "DRAFT",
    },
    include: { lines: true },
  });
}

async function approveOrderInvoice(prisma, orderId) {
  const invoice = await prisma.invoice.findFirst({
    where: { orderId },
    orderBy: { createdAt: "desc" },
  });
  if (!invoice?.zohoDraftId) {
    throw new Error("Aucun brouillon Zoho pour cette commande.");
  }

  const approved = await approveInvoice({ zohoDraftId: invoice.zohoDraftId });
  const failed = approved.zohoSyncStatus === "FAILED" || approved.ok === false;
  return prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      zohoInvoiceId: approved.zohoInvoiceId || invoice.zohoInvoiceId,
      zohoSyncStatus: approved.zohoSyncStatus || (failed ? "FAILED" : "SENT"),
      lastSyncError: approved.lastSyncError || null,
      status: failed ? invoice.status : "SENT",
    },
    include: { lines: true },
  });
}

module.exports = {
  estimateOrderShippingEur,
  ensureOrderInvoiceDraft,
  approveOrderInvoice,
};
