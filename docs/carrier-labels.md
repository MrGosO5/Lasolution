# Transporteurs, étiquettes et preuve de livraison

## Choix transporteur (décision produit / ops)

| Critère | Questions |
| ------- | --------- |
| Corridor | France → Afrique (international) + dernier km local |
| API | Création d’étiquette, tracking, annulation |
| Formats | PDF étiquette, codes-barres, exigences douanières |

**Statut** : **à trancher** avec les opérations (un ou plusieurs transporteurs, sous-traitance).

## Implémentation logicielle (cible)

- **Abstraction** : `CarrierAdapter` dans `backend/src/carriers/adapter.js` (stub) — méthodes `createShipment`, etc.
- **Stockage** : PDF étiquette en stockage objet (S3 / MinIO dev), URL référencée sur `Parcel.labelUrl`.
- **QR colis** : payload signé contenant au minimum `parcel_id` et `exp` (expiration) ; jamais de PII en clair dans le QR.
- **Preuve livraison** |
  - **Relais** : scan QR peut suffire si la politique métier le valide. |
  - **Solu livreur** : **QR + code client** (OTP / hash stocké) pour limiter la fraude, comme décrit dans le plan (F5d).

## Prochaines étapes

1. Sélectionner le(s) transporteur(s) et obtenir accès sandbox API.  
2. Mapper les statuts transporteur → `TrackingEvent.status` interne.  
3. Définir le template d’étiquette (logo, références `order_id` / `parcel_id`).  
4. Tests E2E : création expédition → webhook / polling tracking → notification client.
