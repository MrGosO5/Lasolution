const { getZohoAccessToken } = require("./oauth");
const { zohoConfig } = require("../integrationsConfig");

async function zohoFetch(path, { method = "GET", body } = {}) {
  const cfg = zohoConfig();
  const token = await getZohoAccessToken();
  const url = `${cfg.apiBase}/books/v3${path}${path.includes("?") ? "&" : "?"}organization_id=${encodeURIComponent(cfg.organizationId)}`;

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.code === 1) {
    const msg = data.message || data.error || `Zoho Books ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

async function findOrCreateContact({ email, name, phone }) {
  const q = email ? encodeURIComponent(email) : "";
  if (q) {
    const search = await zohoFetch(`/contacts?email=${q}`);
    const hit = search?.contacts?.[0];
    if (hit?.contact_id) return hit.contact_id;
  }

  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  const created = await zohoFetch("/contacts", {
    method: "POST",
    body: {
      contact_name: name || email || "Client La Solution",
      contact_persons: [
        {
          first_name: parts.length > 1 ? parts.slice(1).join(" ") : parts[0] || "Client",
          last_name: parts.length > 1 ? parts[0] : "",
          email: email || undefined,
          phone: phone || undefined,
          is_primary_contact: true,
        },
      ],
    },
  });
  return created.contact.contact_id;
}

async function createDraftInvoice({ customerId, reference, lines }) {
  const cfg = zohoConfig();
  const lineItems = (lines || []).map((line) => ({
    name: line.label || "Expédition",
    rate: Number(line.amount) || 0,
    quantity: 1,
    tax_percentage: cfg.taxRate,
  }));

  const data = await zohoFetch("/invoices", {
    method: "POST",
    body: {
      customer_id: customerId,
      reference_number: reference,
      currency_code: cfg.currency,
      line_items: lineItems,
    },
  });

  const inv = data.invoice;
  return {
    ok: true,
    zohoDraftId: String(inv.invoice_id),
    zohoInvoiceId: String(inv.invoice_id),
    status: inv.status,
    contactId: customerId,
  };
}

async function approveInvoice({ zohoDraftId }) {
  await zohoFetch(`/invoices/${encodeURIComponent(zohoDraftId)}/status/sent`, {
    method: "POST",
    body: {},
  });
  return {
    ok: true,
    zohoInvoiceId: String(zohoDraftId),
    status: "SENT",
  };
}

module.exports = {
  findOrCreateContact,
  createDraftInvoice,
  approveInvoice,
};
