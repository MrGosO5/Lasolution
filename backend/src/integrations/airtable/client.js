const { airtableConfig, isAirtableConfigured } = require("../integrationsConfig");
const { COLIS_FIELDS } = require("./fieldNames");

const FIELD_TRACKING = COLIS_FIELDS.lasolTracking;
const FIELD_ORDER_ID = COLIS_FIELDS.orderId;

function tableUrl(tableName) {
  const cfg = airtableConfig();
  const encoded = encodeURIComponent(tableName);
  return `https://api.airtable.com/v0/${cfg.baseId}/${encoded}`;
}

async function airtableRequest(tableName, path = "", options = {}) {
  if (!isAirtableConfigured()) {
    throw new Error("Airtable non configuré (AIRTABLE_PAT, AIRTABLE_BASE_ID).");
  }
  const cfg = airtableConfig();
  const url = `${tableUrl(tableName)}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${cfg.pat}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || data?.error || `Airtable ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

async function createColisRecord(fields) {
  const cfg = airtableConfig();
  const data = await airtableRequest(cfg.tableColis, "", {
    method: "POST",
    body: JSON.stringify({ fields }),
  });
  // POST { fields } → record top-level ; POST { records: [...] } → data.records[0]
  const rec = data.records?.[0] || (data.id ? data : null);
  if (!rec) throw new Error("Airtable: création Colis sans enregistrement retourné.");
  return normalizeRecord(rec);
}

async function getColisRecord(recordId) {
  const cfg = airtableConfig();
  const data = await airtableRequest(cfg.tableColis, `/${encodeURIComponent(recordId)}`);
  return normalizeRecord(data);
}

async function updateColisRecord(recordId, fields) {
  const cfg = airtableConfig();
  const data = await airtableRequest(cfg.tableColis, `/${encodeURIComponent(recordId)}`, {
    method: "PATCH",
    body: JSON.stringify({ fields }),
  });
  return normalizeRecord(data);
}

async function listColisModifiedSince(isoSince) {
  const cfg = airtableConfig();
  const since = isoSince || new Date(Date.now() - cfg.pullIntervalMs).toISOString();
  const formula = encodeURIComponent(`IS_AFTER(LAST_MODIFIED_TIME(), '${since}')`);
  const records = [];
  let offset;

  do {
    const qs = `?filterByFormula=${formula}&pageSize=100${offset ? `&offset=${offset}` : ""}`;
    const data = await airtableRequest(cfg.tableColis, qs);
    for (const rec of data.records || []) {
      records.push(normalizeRecord(rec));
    }
    offset = data.offset;
  } while (offset);

  return records;
}

function normalizeRecord(rec) {
  const fields = rec.fields || {};
  return {
    id: rec.id,
    createdTime: rec.createdTime,
    fields,
    orderId: fields[FIELD_ORDER_ID] ?? null,
    trackingNumber: fields[FIELD_TRACKING] ?? fields["Numéro de Suivi La Solution"] ?? null,
    orderStatus: fields[COLIS_FIELDS.orderStatus] ?? fields.OrderStatus ?? null,
    weightKg: fields[COLIS_FIELDS.weight] ?? null,
    shippedAt: fields[COLIS_FIELDS.shippedDate] ?? fields["Date d'envoi du Colis"] ?? null,
    adminNotes:
      fields[COLIS_FIELDS.notes] ??
      fields[COLIS_FIELDS.instructions] ??
      fields["Notes pour préparation de Commandes"] ??
      null,
  };
}

module.exports = {
  FIELD_TRACKING,
  FIELD_ORDER_ID,
  createColisRecord,
  getColisRecord,
  updateColisRecord,
  listColisModifiedSince,
  isAirtableConfigured,
};
