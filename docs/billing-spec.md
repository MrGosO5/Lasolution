# Facturation (Billing) + Zoho Books

## Modèle

- `Invoice` + `InvoiceLine` (HT/TTC, références `orderId`, `parcelId` optionnel).
- Statuts : `DRAFT`, `SENT`, `PAID`, `VOID`, `CREDITED`.
- Champs sync : `zohoDraftId`, `zohoInvoiceId`, `zohoSyncStatus`, `lastSyncError`.

## Flux

1. Événement métier (ex. poids colis) → job `invoice_draft_sync`.
2. Appel API Zoho (OAuth2) — voir `backend/src/integrations/zohoBooks.js` (stub).
3. Admin valide → finalisation Zoho + mise à jour statut.
4. Paiement client → webhook PSP → `Invoice.PAID` + `record payment` Zoho si configuré.

## Avoirs

- `CreditNote` lié à `Invoice` (à ajouter au schéma en itération suivante si besoin).
