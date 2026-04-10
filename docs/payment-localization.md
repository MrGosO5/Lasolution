# Paiements localisés (Afrique) — matrice indicative

## Routeur (`PaymentRouter`)

Le backend expose `POST /payments/route` (voir `backend/src/payment/router.js`) qui choisit un **provider** et une **méthode** à partir de `country_code`, `currency`, `method` (optionnel).

La configuration par défaut est dans `config/payment-methods.json` (copier depuis `payment-methods.example.json` si besoin).

## Matrice pays × méthode (à valider contractuellement)

| Pays | Devise | Méthodes cibles typiques        | PSP agrégateur (exemples)   |
|------|--------|----------------------------------|-----------------------------|
| BJ   | XOF    | Orange Money, MTN MoMo, cartes   | Flutterwave, FedaPay, …     |
| TG   | XOF    | idem                             | idem                        |
| GA   | XAF    | Airtel Money, cartes             | à cartographier             |

## Hors-ligne

`method: "bank_transfer"` → statut métier `AWAITING_MANUAL_CONFIRMATION` ; preuve + validation admin.

## Implémentation

- Table Prisma `PaymentMethodConfig` pour surcharge en base (future).
- Connecteurs PSP réels : brancher sur `createPayment` dans `backend/src/integrations/psp/`.
