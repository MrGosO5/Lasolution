# Conciergerie (achat pour compte) — flux et états

## Types de commande

- `DIRECT_TO_WAREHOUSE` : le client envoie vers l’entrepôt France.
- `CONCIERGE_PURCHASE` : la plateforme achète pour le client (URLs produits, budget).

## Machine à états `ProcurementRequest`

1. `CREATED` — demande saisie.
2. `QUOTE_PENDING` — attente devis interne.
3. `QUOTE_SENT` — devis envoyé au client.
4. `CLIENT_APPROVED` — client valide (souvent après paiement partiel/total).
5. `PURCHASED` — commande passée par l’opérateur.
6. `RECEIVED_AT_WAREHOUSE` — colis réceptionné ; fusion avec flux `Parcel` / `Order`.
7. `REJECTED` / `CANCELLED` — fins d’échec.

## Automatisation

- **MVP** : opérateur humain + suivi dans l’admin (pas de scraping sans cadre légal).
- Données : tables Prisma `ProcurementRequest`, `ProcurementLine`.
