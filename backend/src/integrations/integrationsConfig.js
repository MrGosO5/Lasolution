/** Configuration centralisée Zoho Books + Airtable (env). */

function isZohoConfigured() {
  return Boolean(
    process.env.ZOHO_CLIENT_ID &&
      process.env.ZOHO_CLIENT_SECRET &&
      process.env.ZOHO_REFRESH_TOKEN &&
      process.env.ZOHO_ORGANIZATION_ID,
  );
}

function zohoConfig() {
  return {
    clientId: process.env.ZOHO_CLIENT_ID || "",
    clientSecret: process.env.ZOHO_CLIENT_SECRET || "",
    refreshToken: process.env.ZOHO_REFRESH_TOKEN || "",
    organizationId: process.env.ZOHO_ORGANIZATION_ID || "",
    apiBase: (process.env.ZOHO_BOOKS_API_BASE || "https://www.zohoapis.eu").replace(/\/$/, ""),
    accountsBase: (process.env.ZOHO_ACCOUNTS_BASE || "https://accounts.zoho.eu").replace(/\/$/, ""),
    taxRate: Number(process.env.ZOHO_INVOICE_TAX_RATE || "20"),
    currency: process.env.ZOHO_INVOICE_CURRENCY || "EUR",
  };
}

function isAirtableConfigured() {
  return Boolean(process.env.AIRTABLE_PAT && process.env.AIRTABLE_BASE_ID);
}

function airtableConfig() {
  return {
    pat: process.env.AIRTABLE_PAT || "",
    baseId: process.env.AIRTABLE_BASE_ID || "",
    tableColis: process.env.AIRTABLE_TABLE_COLIS || "Colis",
    parametresRecordId:
      process.env.AIRTABLE_PARAMETRES_RECORD_ID || "recn3WIQZNHBhmAhU",
    /** Pull bidirectionnel opt-in uniquement (`AIRTABLE_PULL_ENABLED=true`). */
    pullEnabled: String(process.env.AIRTABLE_PULL_ENABLED || "").toLowerCase() === "true",
    pullIntervalMs: parseInt(process.env.AIRTABLE_PULL_INTERVAL_MS || "300000", 10),
    antiLoopMs: parseInt(process.env.AIRTABLE_ANTI_LOOP_MS || "120000", 10),
  };
}

module.exports = {
  isZohoConfigured,
  zohoConfig,
  isAirtableConfigured,
  airtableConfig,
};
