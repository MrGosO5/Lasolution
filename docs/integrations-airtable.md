# Intégration Airtable — ops colis

La base Airtable **« Gestion des Expéditions Colis »** est un miroir **push-only** (MVP). L’app est la source de vérité produit et du **numéro de suivi**. Zoho Books gère la facturation via une façade commune.

## Architecture

```text
Routes admin / création
        │
        ▼
 IntegrationService
   ├── pushToAirtable
   ├── pushToZoho
   └── getIntegration → table IntegrationLink
```

- **Pas de pull** tant que `AIRTABLE_PULL_ENABLED` ≠ `true` (défaut : désactivé).
- Pas de Redis / webhooks / files de messages dans ce MVP.

## Prérequis (`.env.local`)

| Variable | Description |
|----------|-------------|
| `AIRTABLE_PAT` | PAT (`data.records:read` + `data.records:write`) |
| `AIRTABLE_BASE_ID` | ID base `app…` |
| `AIRTABLE_TABLE_COLIS` | Défaut `Colis` |
| `AIRTABLE_PARAMETRES_RECORD_ID` | QR Linktree (défaut `recn3WIQZNHBhmAhU`) |
| `AIRTABLE_PULL_ENABLED` | `false` par défaut ; `true` pour activer le pull worker |
| `AIRTABLE_PULL_INTERVAL_MS` | Défaut `300000` (5 min) si pull on |

Voir aussi [`env.integrations.example`](../env.integrations.example) et [`integrations-zoho-psp.md`](integrations-zoho-psp.md).

## Numéro de suivi (canonique)

Généré **par l’application**, immuable et déterministe à partir de l’`entityId` :

```text
LASOL-{10 caractères Crockford Base32}
Exemple : LASOL-8F2KD7P41M
Alphabet : 0123456789ABCDEFGHJKMNPQRSTVWXYZ (pas de I, L, O, U)
```

- Même `entityId` ⇒ même numéro.
- Indépendant d’Airtable (fonctionne si AT est down).
- Anciens formats (formule Airtable / `LASOL-XXXXXXXX`) : **lecture seule** pour l’historique.

Implémentation : `backend/src/lib/airtableTracking.js`, `lib/airtable-tracking.ts`.

## Table `IntegrationLink`

Liens techniques isolés du métier (`SecurityEvent` / `Order`) :

| Champ | Type |
|-------|------|
| `entityType` | enum `SHIPPING_REQUEST` \| `ORDER` |
| `provider` | enum `AIRTABLE` \| `ZOHO` |
| `externalId` | ID externe (record Airtable, invoice Zoho) |
| `status` | `PENDING` \| `SYNCED` \| `FAILED` \| `DRAFT` \| `SENT` |
| `lastErrorCode` / `lastErrorMessage` | Diagnostic |
| `lastAttemptAt` / `retryCount` | Compteurs (retry auto hors MVP) |
| `meta` | JSON satellites (`airtableOrderId`, `zohoContactId`) |

Unique `(entityType, entityId, provider)`.

## Push (app → Airtable / Zoho)

Déclenché après création / PATCH expédition, réception / pesée / ship commande, ou boutons admin **Forcer sync**.

Routes :

- `POST /admin/shipping-requests/:id/airtable/sync`
- `POST /orders/:id/airtable/sync`
- `POST …/zoho/draft` / `…/zoho/approve` (via `IntegrationService`)

## Pull (opt-in)

Le worker n’appelle Airtable que si `AIRTABLE_PULL_ENABLED=true`. Code conservé pour une activation ultérieure sans réécriture.

## Observabilité admin

- `GET /admin/integrations/status`
- Fiches expédition / commande : erreurs structurées (`lastErrorCode` + message) + forcer sync

## Statuts métier

Un seul code statut en app. [`statusMap.js`](../backend/src/integrations/airtable/statusMap.js) projette vers les libellés Airtable (one-way). Les macro-étapes ne sont pas persistées.

## OAuth Zoho

Redirect URI dev : `http://localhost:4000/admin/integrations/zoho/callback`  
Copier `ZOHO_REFRESH_TOKEN` dans `.env.local` après autorisation.
