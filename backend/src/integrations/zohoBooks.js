/**
 * Zoho Books — API réelle si credentials présents, sinon stub (dev sans credentials).
 * Si credentials présents et échec API → FAILED (pas de stub silencieux).
 */

const { isZohoConfigured } = require("./integrationsConfig");

function stubDraft(orderId) {
  return {
    ok: true,
    zohoDraftId: `draft_stub_${orderId}_${Date.now()}`,
    zohoSyncStatus: "DRAFT_STUB",
    lines: [],
  };
}

function stubApprove(zohoDraftId) {
  return {
    ok: true,
    zohoInvoiceId: `inv_stub_${zohoDraftId}`,
    status: "SENT",
    zohoSyncStatus: "SENT_STUB",
  };
}

async function createDraftInvoice({ orderId, lines, customer }) {
  if (!isZohoConfigured()) {
    return { ...stubDraft(orderId), lines: lines || [] };
  }

  try {
    const books = require("./zoho/booksClient");
    const contactId = await books.findOrCreateContact({
      email: customer?.email,
      name: customer?.name,
      phone: customer?.phone,
    });
    const out = await books.createDraftInvoice({
      customerId: contactId,
      reference: orderId,
      lines,
    });
    return {
      ok: true,
      zohoDraftId: out.zohoDraftId,
      zohoInvoiceId: out.zohoInvoiceId,
      zohoContactId: contactId,
      zohoSyncStatus: "DRAFT",
      status: out.status,
      lines: lines || [],
    };
  } catch (e) {
    console.warn("[zohoBooks] createDraftInvoice:", e?.message || e);
    return {
      ok: false,
      zohoDraftId: null,
      zohoInvoiceId: null,
      zohoSyncStatus: "FAILED",
      lastSyncError: String(e.message || e).slice(0, 500),
      lastErrorCode: "ZOHO_CREATE_DRAFT_FAILED",
      lines: lines || [],
    };
  }
}

async function approveInvoice({ zohoDraftId }) {
  if (!isZohoConfigured()) {
    return stubApprove(zohoDraftId);
  }

  try {
    const books = require("./zoho/booksClient");
    const out = await books.approveInvoice({ zohoDraftId });
    return {
      ok: true,
      zohoInvoiceId: out.zohoInvoiceId,
      status: out.status,
      zohoSyncStatus: "SENT",
    };
  } catch (e) {
    console.warn("[zohoBooks] approveInvoice:", e?.message || e);
    return {
      ok: false,
      zohoInvoiceId: zohoDraftId || null,
      status: "FAILED",
      zohoSyncStatus: "FAILED",
      lastSyncError: String(e.message || e).slice(0, 500),
      lastErrorCode: "ZOHO_APPROVE_FAILED",
    };
  }
}

module.exports = { createDraftInvoice, approveInvoice, isZohoConfigured };
