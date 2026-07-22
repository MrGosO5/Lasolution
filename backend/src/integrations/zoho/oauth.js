const { zohoConfig } = require("../integrationsConfig");

let cached = { accessToken: null, expiresAt: 0 };

async function getZohoAccessToken() {
  const now = Date.now();
  if (cached.accessToken && cached.expiresAt > now + 60_000) {
    return cached.accessToken;
  }

  const cfg = zohoConfig();
  const url = `${cfg.accountsBase}/oauth/v2/token`;
  const body = new URLSearchParams({
    refresh_token: cfg.refreshToken,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    grant_type: "refresh_token",
  });

  const res = await fetch(url, { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(data.error || data.message || `Zoho OAuth ${res.status}`);
  }

  cached = {
    accessToken: data.access_token,
    expiresAt: now + (Number(data.expires_in) || 3600) * 1000,
  };
  return cached.accessToken;
}

function clearZohoTokenCache() {
  cached = { accessToken: null, expiresAt: 0 };
}

module.exports = { getZohoAccessToken, clearZohoTokenCache };
