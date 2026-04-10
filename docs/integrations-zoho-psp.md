# Intégrations — Zoho Books & PSP

## Zoho Books

- OAuth2 authorization code ; refresh token stocké chiffré (vault).
- Scopes : invoices, contacts, payments (selon besoin).
- Webhooks entrants Zoho : endpoint dédié + idempotence.
- **Stub** : `backend/src/integrations/zohoBooks.js` — remplacer par appels HTTP réels.

## PSP (Stripe, Flutterwave, Paystack, …)

- Connecteurs sous `backend/src/integrations/psp/` — interface commune dans `index.js`.
- Documentation officielle : voir plan produit (tableau des liens doc).

## Réconciliation

- Job quotidien : comparer balance / liste transactions PSP vs table `Payment` (worker futur).
