/**
 * Check integrations without printing secrets.
 * Loads ../.env.local manually.
 */
const fs = require("fs");
const path = require("path");

function loadEnv(file) {
  const text = fs.readFileSync(file, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnv(path.resolve(__dirname, "../../.env.local"));

async function checkZoho() {
  const clientId = process.env.ZOHO_CLIENT_ID || "";
  const clientSecret = process.env.ZOHO_CLIENT_SECRET || "";
  const refresh = process.env.ZOHO_REFRESH_TOKEN || "";
  const accounts = (process.env.ZOHO_ACCOUNTS_BASE || "https://accounts.zoho.com").replace(/\/$/, "");
  const books = (process.env.ZOHO_BOOKS_API_BASE || "https://www.zohoapis.com").replace(/\/$/, "");
  const org = process.env.ZOHO_ORGANIZATION_ID || "";

  const report = {
    clientIdLen: clientId.length,
    clientIdPrefix: clientId.slice(0, 6),
    secretLen: clientSecret.length,
    refreshLen: refresh.length,
    refreshPrefix: refresh.slice(0, 6),
    accounts,
    books,
    org,
  };

  if (!clientId || !clientSecret || !refresh || !org) {
    return { ...report, ok: false, error: "missing_env" };
  }

  const body = new URLSearchParams({
    refresh_token: refresh,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
  });
  const res = await fetch(`${accounts}/oauth/v2/token`, { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    return {
      ...report,
      ok: false,
      http: res.status,
      error: data.error || data.message || "no_access_token",
    };
  }

  const orgRes = await fetch(
    `${books}/books/v3/organizations?organization_id=${encodeURIComponent(org)}`,
    { headers: { Authorization: `Zoho-oauthtoken ${data.access_token}` } },
  );
  const orgData = await orgRes.json().catch(() => ({}));
  return {
    ...report,
    ok: true,
    tokenOk: true,
    booksOrgsHttp: orgRes.status,
    booksCode: orgData.code,
    booksMessage: orgData.message || null,
  };
}

async function checkAirtable() {
  const pat = process.env.AIRTABLE_PAT || "";
  const baseId = process.env.AIRTABLE_BASE_ID || "";
  const table = process.env.AIRTABLE_TABLE_COLIS || "Colis";
  const report = {
    patLen: pat.length,
    patPrefix: pat.slice(0, 5),
    baseId,
    table,
    pullEnabled: process.env.AIRTABLE_PULL_ENABLED || "(unset=false)",
  };

  if (!pat || !baseId) return { ...report, ok: false, error: "missing_env" };
  if (!/^app[A-Za-z0-9]+$/.test(baseId)) {
    return { ...report, ok: false, error: "base_id_format_invalid" };
  }
  if (pat.length < 20) {
    return { ...report, ok: false, error: "pat_suspiciously_short" };
  }

  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}?maxRecords=1`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${pat}` } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ...report,
      ok: false,
      http: res.status,
      error: data?.error?.message || data?.error?.type || data?.error || `http_${res.status}`,
    };
  }
  return { ...report, ok: true, recordsReturned: (data.records || []).length };
}

(async () => {
  const zoho = await checkZoho();
  const airtable = await checkAirtable();
  console.log(JSON.stringify({ zoho, airtable }, null, 2));
})().catch((e) => {
  console.error(String(e));
  process.exit(1);
});
