# Corridor France ↔ Afrique (référence produit)

## Objectif

Permettre aux clients en **Afrique** de recevoir des colis en provenance de **France** (entrepôt, puis transport international et dernier kilomètre).

## Pays MVP (liste extensible)

| Pays   | Code ISO | Devise | Zone      |
|--------|----------|--------|-----------|
| Bénin  | BJ       | XOF    | UEMOA     |
| Togo   | TG       | XOF    | UEMOA     |
| Gabon  | GA       | XAF    | CEMAC     |

## Entrepôt France

- Adresse(s) stockées en base (`WarehouseAddress`) et exposées au client pour **envoi direct** ou livraison marchand.
- Devise de référence fournisseur / France : **EUR**.

## Devises et FX

- **XOF** (UEMOA), **XAF** (CEMAC), **EUR** : affichage et paiement selon `PaymentMethodConfig` et PSP.
- Stocker `fx_rate_used` sur facture / paiement au moment du devis ou du checkout (implémentation métier à brancher sur les services).

## Douanes (évolution)

- Prévoir champs sur colis / commande : valeur déclarée, catégorie HS, pièces jointes — alignement transporteur.

## Données de seed

Les pays MVP sont insérés via `prisma/seed.js` (voir script `npm run db:seed`).
