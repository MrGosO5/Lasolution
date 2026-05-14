# Passation front — Admin commandes / colis (entrepôt)

Ce document résume ce qui est **déjà en place côté backend et Next (proxy)**, comment **charger des données de test**, et **comment appeler l’API** depuis le front.

Documents complémentaires :

- Vision produit / roadmap ops : [`admin-ops-backoffice.md`](./admin-ops-backoffice.md)
- Statuts cibles : [`state-machines.md`](./state-machines.md)
- Contrat HTTP (JWT, chemins) : [`../openapi/openapi.yaml`](../openapi/openapi.yaml)
- Schéma BDD : [`../backend/prisma/schema.prisma`](../backend/prisma/schema.prisma)

---

## 1. Prérequis locaux

| Élément | Rôle |
|--------|------|
| **PostgreSQL** + `DATABASE_URL` dans `.env.local` (racine repo) | Prisma + émission du **JWT** au login |
| **Backend** `npm run backend:dev` (port **4000** par défaut) | API Express |
| **Front** `npm run dev` (souvent port **3001**) | Next.js + NextAuth |
| **`NEXTAUTH_SECRET`** | Session NextAuth |
| **`API_JWT_SECRET`** (backend) | Signature des `accessToken` retournés par `POST /auth/login` |

## 2. Seeds à lancer (ordre recommandé)

Toujours depuis le dossier **`backend`**, avec le même `.env.local` que les migrations :

```powershell
cd backend
npx dotenv-cli -e ../.env.local -- npm run db:seed
```

Puis **jeu de données commandes / colis** pour tester l’admin sans créer de commandes à la main :

```powershell
npx dotenv-cli -e ../.env.local -- npm run db:seed:demo-orders
```

Scripts dans `backend/package.json` :

- `db:seed` → `prisma/seed.js` (pays, utilisateurs démo, missions, etc.)
- `db:seed:demo-orders` → `prisma/seed-demo-orders.js` (**réécrit** les commandes démo listées ci‑dessous)

### 2.1 Identifiants utiles après seed principal

| Rôle | Email | Mot de passe (défaut) |
|------|--------|-------------------------|
| Admin | `adminlasolution@gmail.com` | `adminlasolution@x` (ou `ADMIN_PASSWORD`) |
| Client démo | `client@lasolution.demo` | `client` (ou `CLIENT_PASSWORD`) |

Les mots de passe sont aussi stockés en **`User.passwordHash`** après le seed principal (hash PBKDF2).

### 2.2 Commandes créées par `seed-demo-orders.js`

Le script **supprime puis recrée** ces IDs (idempotent si on relance le script).

| ID commande | Cas de test |
|-------------|-------------|
| `order-demo-pending-receipt` | **PAID**, 1 colis non réceptionné → enchaîner réception → poids → ship |
| `order-demo-two-parcels` | **PAID**, 2 colis (un déjà réceptionné, un à traiter) |
| `order-demo-ready-to-ship` | Colis **réceptionné + pesé** → tester surtout **ship** |
| `order-demo-awaiting-payment` | **AWAITING_PAYMENT** → la réception entrepôt doit **échouer** (409) |
| `order-demo-concierge` | **CONCIERGE_PURCHASE** + `ProcurementRequest` |

IDs colis notables : `parcel-demo-1a` … `parcel-demo-5a` (voir le fichier seed pour le détail).

---

## 3. Règles métier backend (résumé pour l’UI)

Ordre **obligatoire** pour un colis :

1. **`POST /parcels/:id/warehouse-receipt`** avec `{ "receivedAt": "<ISO8601>" }`  
   - Refus si commande **annulée** ou **AWAITING_PAYMENT**.  
   - Met le colis en **`WAREHOUSE_RECEIVED`**, crée un **`TrackingEvent`**, **audit**, puis **`syncOrderStatusFromParcels`** sur la commande.

2. **`PATCH /parcels/:id`** avec `{ "weightKg": <number> }`  
   - **Uniquement après** réception (`receivedAt` présent).  
   - Pas de changement de statut colis via ce PATCH (le statut colis passe par warehouse-receipt / ship).

3. **`POST /parcels/:id/ship`** avec `{ "shippedAt": "<ISO8601>", "message"?: string, "meta"?: object }`  
   - Exige **réception + poids > 0**.  
   - Met **`SHIPPED`**, `shippedAt`, tracking, audit, sync commande.

La synchronisation **`syncOrderStatusFromParcels`** (voir `backend/src/lib/parcelWorkflow.js`) peut faire monter **`Order.status`** vers `WAREHOUSE_RECEIVED`, `WEIGHT_CAPTURED`, `SHIPPED` selon **tous** les colis de la commande (ne rétrograde pas ; ignore certaines commandes).

### 3.1 Statuts commande (PATCH admin)

`PATCH /orders/:id` (admin) accepte notamment :

`AWAITING_PAYMENT`, `PAID`, `WAREHOUSE_RECEIVED`, `WEIGHT_CAPTURED`, `INVOICE_DRAFT`, `INVOICE_APPROVED`, `READY_TO_SHIP`, `SHIPPED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`

Implémentation : `backend/src/routes/ordersParcels.js` (liste `allowed`).

**Recommandation UX** : ne pas exposer n’importe quelle transition ; guider l’admin selon l’état réel des colis + la doc `state-machines.md`. Le backend valide une partie des incohérences, pas toutes les transitions « métier ».

---

## 4. API backend (Express, port 4000)

Authentification : header **`Authorization: Bearer <accessToken>`**  
Obtenu via **`POST /auth/login`** `{ "email", "password" }` (réponse JSON : `accessToken`, `refreshToken`, etc.).

### 4.1 Routes utiles admin commandes / colis

| Méthode | Chemin | Rôle |
|---------|--------|------|
| GET | `/orders` | Liste (admin : tous ; query `search`, `status`, pagination) |
| GET | `/orders/stats` | Agrégats (KPI dashboard) |
| GET | `/orders/:id` | Détail ; si admin, inclut souvent `defaultWarehouse` |
| PATCH | `/orders/:id` | **Admin** — `{ "status": "PAID" \| … }` |
| GET | `/parcels/:id` | Détail colis (admin ou propriétaire) |
| PATCH | `/parcels/:id` | **Admin** — `{ "weightKg" }` uniquement (pas `status` dans le body) |
| POST | `/parcels/:id/warehouse-receipt` | **Admin** — `{ "receivedAt" }` |
| POST | `/parcels/:id/ship` | **Admin** — `{ "shippedAt", "message"?, "meta"? }` |
| POST | `/parcels/:id/tracking-events` | **Admin** — événements de suivi libres (hors flux warehouse/ship si besoin) |

Autres routes admin globales (exemples) : `GET /admin/stats`, `GET /admin/users`, … — voir `backend/src/routes/index.js` et `ordersParcels.js`.

### 4.2 Tester sans UI

Exemples PowerShell (adapter email / mot de passe) :

```powershell
$login = Invoke-RestMethod -Uri "http://localhost:4000/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"adminlasolution@gmail.com","password":"adminlasolution@x"}'
$token = $login.accessToken
$h = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }

Invoke-RestMethod -Uri "http://localhost:4000/orders/order-demo-pending-receipt" -Headers @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:4000/parcels/parcel-demo-1a/warehouse-receipt" -Method POST -Headers $h -Body '{"receivedAt":"2026-05-14T12:00:00.000Z"}'
```

---

## 5. Intégration Next.js (ce que le front admin doit utiliser)

### 5.1 Côté navigateur (composants `"use client"`)

Préférer les **routes API Next** sous `app/api/admin/...` : elles vérifient la **session** + rôle **admin**, récupèrent **`session.user.accessToken`**, puis proxifient vers le backend.

Fichiers existants :

| Route Next | Backend proxifié |
|------------|------------------|
| `GET/ PATCH` `app/api/admin/orders/[id]/route.ts` | `GET/PATCH /orders/:id` |
| `PATCH` `app/api/admin/parcels/[id]/route.ts` | `PATCH /parcels/:id` |
| `POST` `app/api/admin/parcels/[id]/warehouse-receipt/route.ts` | `POST /parcels/:id/warehouse-receipt` |
| `POST` `app/api/admin/parcels/[id]/ship/route.ts` | `POST /parcels/:id/ship` |
| `POST` `app/api/admin/parcels/[id]/tracking-events/route.ts` | `POST /parcels/:id/tracking-events` |

Exemple côté client :

```ts
await fetch(`/api/admin/parcels/${parcelId}/warehouse-receipt`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ receivedAt: new Date().toISOString() }),
});
```

Gérer `res.ok`, afficher `json.error` si présent.

### 5.2 Côté serveur (Server Components, `lasolutionFetch`)

Pour les pages dashboard en **RSC**, utiliser **`lasolutionFetch` / `lasolutionFetchJson`** (`lib/lasolution-api.ts`) qui injectent le Bearer depuis la session.

Exemple :

```ts
import { lasolutionFetchJson } from "@/lib/lasolution-api";

const order = await lasolutionFetchJson(`/orders/${id}`);
```

### 5.3 Pages dashboard déjà liées (état au moment de la rédaction)

- Liste : `app/dashboard/commandes/page.tsx`
- Détail : `app/dashboard/commandes/[id]/page.tsx` + `CommandeDetailClient.tsx`

Le détail doit progressivement appeler les nouveaux endpoints (réception, ship) au lieu d’anciens flux uniquement « tracking event » si encore présents — aligner l’UI sur les routes du tableau ci‑dessus.

---

## 6. Pièges fréquents

| Symptôme | Cause probable |
|----------|----------------|
| 401 sur `/api/admin/...` | Pas d’**`accessToken`** dans le JWT (relogin après fix DB / secrets) |
| Connexion refusée vers `localhost:4000` | Backend arrêté ou mauvais `AUTH_API_URL` |
| 409 « commande doit être en PAID » | Commande encore `AWAITING_PAYMENT` |
| 409 « réception requise avant la pesée » | Ordre des actions inversé |
| 409 « poids requis avant expédition » | Ship appelé sans `PATCH` poids |
| Page « Sign out » NextAuth | Ne pas lier vers `/api/auth/signout` en GET pour la déconnexion UX ; utiliser `signOut({ callbackUrl: "/connexion" })` (déjà en place sur le site via `SiteSignOutButton`) |

---

## 7. Checklist livraison front admin (suggestion)

- [ ] Liste commandes : filtres `search` / `status` alignés sur les valeurs réelles en base.
- [ ] Détail commande : afficher **lignes**, **colis** (`receivedAt`, `shippedAt`, `weightKg`, `status`, `trackingEvents`).
- [ ] Actions par colis : **Réception** → **Poids** → **Expédition** (boutons désactivés si prérequis non remplis).
- [ ] PATCH statut commande réservé aux cas métier validés (ou garde-fou UX + message d’erreur API).
- [ ] Toasts / messages d’erreur à partir du JSON backend (`error`).
- [ ] Après chaque action réussie, **re-fetch** détail commande (ou mise à jour optimiste cohérente avec la réponse).
- [ ] Tests manuels sur les **IDs seed** `order-demo-*` / `parcel-demo-*`.

---

## 8. Fichiers clés (référence rapide)

| Fichier | Contenu |
|---------|---------|
| `backend/src/routes/ordersParcels.js` | Routes commandes / colis / admin |
| `backend/src/lib/parcelWorkflow.js` | `syncOrderStatusFromParcels`, rangs de statuts |
| `backend/prisma/seed.js` | Seed principal |
| `backend/prisma/seed-demo-orders.js` | Commandes démo ops |
| `lib/lasolution-api.ts` | Appels SSR authentifiés |
| `app/api/admin/**` | Proxies Next → backend |
| `middleware.ts` | Garde `/dashboard` (rôle admin) ; redirection `/connexion` si déjà connecté |

---

*Document généré pour la passation front admin — commandes / entrepôt / colis.*
