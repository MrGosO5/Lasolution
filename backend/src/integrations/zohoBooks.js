/**
 * Stub Zoho Books — remplacer par OAuth2 + appels REST réels.
 * @see docs/integrations-zoho-psp.md
 */

async function createDraftInvoice({ orderId, lines }) {
  return {
    ok: true,
    zohoDraftId: `draft_stub_${orderId}_${Date.now()}`,
    lines: lines || [],
  };
}

async function approveInvoice({ zohoDraftId }) {
  return {
    ok: true,
    zohoInvoiceId: `inv_stub_${zohoDraftId}`,
    status: "SENT",
  };
}

module.exports = { createDraftInvoice, approveInvoice };
