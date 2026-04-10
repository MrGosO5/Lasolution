# Machines à états (référence)

## Commande (`Order.status`)

`CREATED` → `AWAITING_PAYMENT` → `PAID` → `WAREHOUSE_RECEIVED` → `WEIGHT_CAPTURED` → `INVOICE_DRAFT` → `INVOICE_APPROVED` → `READY_TO_SHIP` → `SHIPPED` → `OUT_FOR_DELIVERY` → `DELIVERED` | `EXCEPTION`

## Colis (`Parcel.status`)

Aligné sur la logistique ; transitions déclenchées par scan relais / livreur.

## Facture (`Invoice.status`)

`DRAFT` → `SENT` → `PAID` | `VOID` → `CREDITED` (avoir)

## Paiement (`Payment.status`)

Voir diagramme dans le plan : `payment_pending` → `succeeded` | `requires_action` ; remboursements / litiges.

## Conciergerie (`ProcurementRequest.status`)

`CREATED` → `QUOTE_PENDING` → `QUOTE_SENT` → `CLIENT_APPROVED` → `PURCHASED` → `RECEIVED_AT_WAREHOUSE` ; `REJECTED`, `CANCELLED`.

## DeliveryJob

`OFFERED` → `ASSIGNED` → `COMPLETED` | `CANCELLED` | `EXPIRED`

## Règles RBAC

Transitions sensibles réservées aux rôles autorisés (admin, livreur pour `DELIVERED` avec preuve, etc.).
