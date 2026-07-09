# Expéditions standalone (demandes hors commande)

> **État : implémenté** (juillet 2026) — UI client + admin, API Express, proxies Next.js.

Ce flux couvre les **demandes d’expédition aérienne ou maritime** soumises par un client qui a déjà acheté ailleurs (ou via le formulaire dédié), **sans passer par une `Order` / `Parcel`**.

Les données sont persistées dans **`SecurityEvent`** avec `type: "shipping_request"` et un objet **`meta`** JSON (statut, adresses, photo, historique, communications, etc.).

**À ne pas confondre** avec le flux **commande → colis** (`Parcel.shippedAt`, `POST /parcels/:id/ship`) documenté dans [`admin-ops-backoffice.md`](./admin-ops-backoffice.md) et [`admin-orders-frontend-handoff.md`](./admin-orders-frontend-handoff.md).

---

## Parcours utilisateur

### Client

| Écran | Route | Rôle |
| --- | --- | --- |
| Formulaire | `/expedier-un-colis` | Création (photo obligatoire, mode AIR/SEA) |
| Liste + suivi | `/mes-expeditions` | Historique, recherche, stats, modale **Suivi** |
| Hub | `/mon-espace` | Carte raccourci « Mes expéditions » |

Après soumission réussie, un client connecté est redirigé vers `/mes-expeditions` (flash de confirmation).

La modale **Suivi** affiche : statut actuel, destinataire, date d’expédition prévue ou réelle, numéro de suivi (si renseigné), timeline (`statusHistory`, communications équipe, création).

### Admin

| Écran | Route | Rôle |
| --- | --- | --- |
| Liste | `/dashboard/expeditions` | Tableau des demandes (`SecurityEvent`) |
| Gestion | Modale **Gérer** (pas de page `/[id]`) | Toutes les actions opérationnelles |

**Actions dans la modale Gérer** :

1. Changer le **statut** (9 valeurs, voir ci-dessous)
2. **Valider facture Zoho** (stub → brouillon approuvé)
3. **Date d’expédition prévue** — n’altère **pas** automatiquement le statut ; passer manuellement à « Expédiée » le jour J
4. **Corriger les données** client (expéditeur, destinataire, adresses, poids, tracking, notes)
5. **Communiquer** au client (email + historique dans `meta.communications`)
6. **Générer / imprimer étiquette** (stub transporteur)
7. **Voir la photo** colis (fichier `uploads/shipping-requests/`)
8. **Supprimer** la demande — confirmation modale, suppression en base + fichier photo

---

## Fichiers principaux

### Frontend site

- `app/(site)/expedier-un-colis/` — formulaire
- `app/(site)/mes-expeditions/page.tsx` — page liste
- `app/(site)/mes-expeditions/MesExpeditionsTable.tsx` — tableau + recherche
- `app/(site)/mes-expeditions/MesExpeditionSuiviModal.tsx` — suivi (portail `document.body`)
- `lib/shipping-expedition-client.ts` — libellés statuts client, timeline, tons UI

### Frontend admin

- `app/dashboard/expeditions/page.tsx` — SSR liste
- `app/dashboard/expeditions/ExpeditionsTableClient.tsx` — tableau + ouverture modale
- `app/dashboard/expeditions/ExpeditionManageModal.tsx` — modale gestion
- `app/dashboard/expeditions/ExpeditionDetailClient.tsx` — formulaires d’actions
- `app/dashboard/expeditions/expedition-detail-data.ts` — mapping API ↔ UI

### Proxies Next.js (admin)

| Route Next | Méthode | Backend |
| --- | --- | --- |
| `/api/admin/shipping-requests` | GET | `GET /admin/shipping-requests` |
| `/api/admin/shipping-requests/[id]` | GET, PATCH, **DELETE** | idem |
| `…/[id]/zoho/approve` | POST | `POST …/zoho/approve` |
| `…/[id]/communicate` | POST | `POST …/communicate` |
| `…/[id]/label` | POST | `POST …/label` |
| `…/[id]/photo` | GET | `GET …/photo` (binaire) |

Auth : session NextAuth `role === "admin"` + `Authorization: Bearer` vers l’API Express (`INTERNAL_AUTH_API_URL` / `127.0.0.1:4000` en local).

### Backend

- `backend/src/routes/shippingRequests.js` — routes publiques, client et admin
- `backend/src/lib/shippingRequestOps.js` — statuts, merge meta, Zoho stub, étiquette stub, photo, sanitize client

Enregistrement dans `backend/src/routes/index.js` via `setupShippingRequestRoutes` + `setupAdminShippingRequestRoutes`.

---

## API Express

### Création (public / client)

| Méthode | Chemin | Notes |
| --- | --- | --- |
| POST | `/shipping-requests/maritime` | Défaut SEA |
| POST | `/shipping-requests/air` | Force AIR |
| POST | `/shipping-requests` | Alias, `transportMode` dans le body |
| POST | `/me/shipping-requests` | Client authentifié, `userId` lié |

Corps : expéditeur/destinataire, adresses, `photoDataUrl` (obligatoire), `weightKg`, `notes`, etc.  
Notification EmailJS / SMTP vers `CUSTOMERCARE_EMAIL`.

### Client connecté

| Méthode | Chemin |
| --- | --- |
| GET | `/me/shipping-requests?limit=` |

Réponse : `{ events: [{ id, createdAt, meta }] }` avec `meta` **sanitisé** (`sanitizeMetaForClient`).

### Admin

| Méthode | Chemin |
| --- | --- |
| GET | `/admin/shipping-requests?limit=` |
| GET | `/admin/shipping-requests/:id` |
| PATCH | `/admin/shipping-requests/:id` |
| DELETE | `/admin/shipping-requests/:id` |
| POST | `/admin/shipping-requests/:id/zoho/approve` |
| POST | `/admin/shipping-requests/:id/communicate` |
| POST | `/admin/shipping-requests/:id/label` |
| GET | `/admin/shipping-requests/:id/photo` |

Toutes protégées par `requireAuth` + `requireRoles("admin")`.

**PATCH** : champs éditables listés dans `EDITABLE_META_KEYS` + `status`, `shippedAt`.  
Chaque changement de statut alimente `meta.statusHistory` (visible côté client).

**DELETE** : supprime le `SecurityEvent` et le fichier photo associé si présent.

---

## Statuts (`meta.status`)

| Code | Libellé admin | Libellé client |
| --- | --- | --- |
| `SUBMITTED` | Soumise | Demande reçue |
| `IN_REVIEW` | En examen | En cours de traitement |
| `QUOTED` | Devis envoyé | Devis envoyé |
| `INVOICE_DRAFT` | Facture brouillon | Facturation en cours |
| `INVOICE_APPROVED` | Facture validée | Facture validée |
| `READY_TO_SHIP` | Prête à expédier | Prête à expédier |
| `SHIPPED` | Expédiée | Expédiée |
| `DELIVERED` | Livrée | Livrée |
| `CANCELLED` | Annulée | Annulée |

---

## Stockage photo

- Répertoire : `uploads/shipping-requests/{eventId}.jpg|png` (ou `UPLOAD_DIR`)
- Chemin relatif dans `meta.photoPath`
- Anciennes demandes (avant implémentation fichier) : seul `meta.photoBytes` peut exister → photo non servie (404)

---

## Intégrations (stubs / partiel)

| Intégration | État |
| --- | --- |
| Zoho Books (`createDraftInvoice`, `approveInvoice`) | Stub — IDs factices, workflow UI OK |
| Transporteur (`CarrierAdapter`, `generateLabelForMeta`) | Stub — tracking / URL étiquette générés |
| Email communication admin | Enregistré en base ; envoi SMTP si `SMTP_HOST` configuré |
| EmailJS soumission formulaire | Selon variables d’environnement |

---

## Développement local

1. Backend : `npm run backend:dev` (port **4000**)
2. Frontend : `npm run dev` (port **3001**)
3. Après modification des routes backend : **redémarrer** le processus Node (sinon 404 sur routes récentes type `PATCH`/`DELETE` `:id`)

En cas de `EADDRINUSE :::4000` :

```bash
# Windows — trouver puis tuer le PID
netstat -ano | findstr ":4000"
taskkill /PID <pid> /F
```

Variables utiles : `INTERNAL_AUTH_API_URL=http://127.0.0.1:4000`, `UPLOAD_DIR`, `SMTP_*`, clés EmailJS.

---

## Production

- Next.js appelle le backend via `INTERNAL_AUTH_API_URL=http://127.0.0.1:4000` sur le VPS (voir [`infra_prod.md`](./infra_prod.md))
- Redémarrer le backend après déploiement : `pm2 restart <process-backend>`
- S’assurer que le dossier `uploads/shipping-requests/` est persistant et sauvegardé si besoin

---

## Évolutions possibles (non fait)

- Lier une demande standalone à une commande existante
- Zoho Books et transporteur réels
- Filtres / export CSV sur `/dashboard/expeditions`
- Notification push client à chaque changement de statut
- Lien header site vers `/mes-expeditions` (actuellement via hub Mon espace)
