const { requireAuth, requireRoles } = require("../middleware/auth");
const {
  isZohoConfigured,
  isAirtableConfigured,
  zohoConfig,
  airtableConfig,
} = require("../integrations/integrationsConfig");
const { getZohoAccessToken, clearZohoTokenCache } = require("../integrations/zoho/oauth");

function setupIntegrationsRoutes(app, getPrisma) {
  const adminOnly = [requireAuth, requireRoles("admin")];

  app.get("/admin/integrations/status", ...adminOnly, async (_req, res) => {
    const prisma = typeof getPrisma === "function" ? getPrisma() : null;
    const cfg = airtableConfig();

    let zohoTokenOk = false;
    let zohoTokenError = null;
    if (isZohoConfigured()) {
      try {
        await getZohoAccessToken();
        zohoTokenOk = true;
      } catch (e) {
        zohoTokenError = String(e.message || e).slice(0, 300);
      }
    }

    let lastAirtableError = null;
    if (prisma) {
      try {
        const orderErr = await prisma.order.findFirst({
          where: { lastAirtableError: { not: null } },
          orderBy: { updatedAt: "desc" },
          select: { lastAirtableError: true },
        });
        lastAirtableError = orderErr?.lastAirtableError || null;
      } catch {
        /* best effort */
      }
    }

    res.json({
      zoho: {
        configured: isZohoConfigured(),
        tokenOk: zohoTokenOk,
        tokenError: zohoTokenError,
        organizationId: isZohoConfigured() ? zohoConfig().organizationId : null,
      },
      airtable: {
        configured: isAirtableConfigured(),
        tableColis: cfg.tableColis,
        pullIntervalMs: cfg.pullIntervalMs,
        antiLoopMs: cfg.antiLoopMs,
        lastErrorSample: lastAirtableError,
      },
    });
  });

  app.get("/admin/integrations/zoho/authorize", ...adminOnly, (_req, res) => {
    const cfg = zohoConfig();
    if (!cfg.clientId) {
      return res.status(503).json({ error: "ZOHO_CLIENT_ID manquant." });
    }
    const redirectUri =
      process.env.ZOHO_OAUTH_REDIRECT_URI ||
      "http://localhost:4000/admin/integrations/zoho/callback";
    const scope = encodeURIComponent("ZohoBooks.fullaccess.all");
    const url =
      `${cfg.accountsBase}/oauth/v2/auth?` +
      `scope=${scope}&client_id=${encodeURIComponent(cfg.clientId)}` +
      `&response_type=code&access_type=offline&prompt=consent` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}`;
    res.redirect(url);
  });

  app.get("/admin/integrations/zoho/callback", ...adminOnly, async (req, res) => {
    const code = req.query?.code;
    if (!code) {
      return res.status(400).send("Code OAuth manquant. Relancez l'autorisation depuis le dashboard admin.");
    }

    const cfg = zohoConfig();
    const redirectUri =
      process.env.ZOHO_OAUTH_REDIRECT_URI ||
      "http://localhost:4000/admin/integrations/zoho/callback";

    try {
      const body = new URLSearchParams({
        code: String(code),
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      });
      const tokenRes = await fetch(`${cfg.accountsBase}/oauth/v2/token`, {
        method: "POST",
        body,
      });
      const data = await tokenRes.json().catch(() => ({}));
      if (!tokenRes.ok || !data.refresh_token) {
        const msg = data.error || data.message || `OAuth ${tokenRes.status}`;
        return res.status(400).send(`Échec OAuth Zoho : ${msg}`);
      }
      clearZohoTokenCache();
      res.type("html").send(
        `<html><body style="font-family:sans-serif;padding:2rem">` +
          `<h1>Zoho Books connecté</h1>` +
          `<p>Ajoutez cette valeur dans <code>.env.local</code> :</p>` +
          `<pre style="background:#f4f4f4;padding:1rem">ZOHO_REFRESH_TOKEN=${data.refresh_token}</pre>` +
          `<p>Redémarrez le backend après mise à jour du fichier.</p>` +
          `</body></html>`,
      );
    } catch (e) {
      res.status(500).send(String(e.message || e));
    }
  });
}

module.exports = { setupIntegrationsRoutes };
