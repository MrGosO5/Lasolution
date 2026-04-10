# Découpage par phases (backlog)

## Phase 1 — MVP corridor + logistique + admin

- Pays BJ/TG/GA + adresses ; entrepôt France.
- Commandes / colis / poids ; Zoho brouillon (stub) ; 1–2 rails paiement.
- Auth multi-rôles ; Docker Compose avec Postgres + Redis.

**Critères d’acceptation** : login par rôle ; création commande test ; parcel + invoice en base.

## Phase 2 — Financier + wallets partenaires

- Matrice paiement complète ; ledger ; payouts ; FX sur factures.

## Phase 3 — Conciergerie

- `ProcurementRequest` bout-en-bout ; pas de scraping non validé juridiquement.

## Phase 4 — Carte virtuelle / émetteur

- Décision `DECISIONS.md` ; intégration émetteur si retenu.

## Phase 5 — Dernier km + ambassadeurs + livreurs

- `DeliveryJob`, QR+code, in-app, matching avancé.

## Tests E2E (cible)

- Parcours : client paie → admin pèse → facture → (mock) étiquette.
