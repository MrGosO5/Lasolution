const fs = require("fs");
const path = require("path");

let cachedRoutes = null;

function loadRoutes() {
  if (cachedRoutes) return cachedRoutes;
  const candidates = [
    path.resolve(__dirname, "../../../config/payment-methods.json"),
    path.resolve(__dirname, "../../../config/payment-methods.example.json"),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        const data = JSON.parse(fs.readFileSync(p, "utf8"));
        cachedRoutes = data.routes || [];
        return cachedRoutes;
      }
    } catch {
      /* try next */
    }
  }
  cachedRoutes = [];
  return cachedRoutes;
}

/**
 * Choisit provider + méthode pour un pays / devise (plan PaymentRouter).
 * @param {{ countryCode: string, currency?: string, method?: string }} input
 */
function resolvePaymentRoute(input) {
  const { countryCode, currency = "*", method } = input;
  const routes = loadRoutes();
  const upper = (countryCode || "").toUpperCase();

  const matches = routes.filter((r) => {
    const cc = r.countryCode === "*" || r.countryCode === upper;
    const cur = r.currency === "*" || r.currency === currency;
    const meth = !method || r.method === method || r.method === "*";
    return cc && cur && meth;
  });

  matches.sort((a, b) => (a.priority || 100) - (b.priority || 100));

  const exact = matches.find((r) => r.countryCode === upper && r.currency === currency);
  if (exact) return { provider: exact.provider, method: exact.method, config: exact };

  const first = matches[0];
  if (first) return { provider: first.provider, method: first.method, config: first };

  return { provider: "offline", method: "bank_transfer", config: null };
}

module.exports = { resolvePaymentRoute, loadRoutes };
