# Évolution de la landing `/`

URL canonique : **`/`** (ex. `http://localhost:3001/`).  
`/coming-soon` est **legacy** — redirect 302 vers `/` (301 après validation produit).

## Feature flags (`lib/landing-config.ts`)

| Variable | Défaut prod | Effet |
|----------|-------------|-------|
| `LANDING_SHOW_WAITLIST` | `false` | Encart waitlist en bas de page |
| `LANDING_SHOW_TRACKING` | `true` | Bloc « Suivez votre commande » |
| `LANDING_SHOW_TESTIMONIALS` | `true` | Section témoignages (API, sans démo) |
| `LANDING_SHOW_NOTIFICATION_DEMO` | `true` | Cartes notifications dans le hero |

En dev, la waitlist est activée par défaut si la variable n’est pas définie.

## Critères de retrait de la waitlist

Désactiver `LANDING_SHOW_WAITLIST` (ou laisser le défaut prod `false`) quand :

1. **Inscription** opérationnelle (`POST /api/register` + connexion NextAuth).
2. **Parcours achat** utilisable : `/boutiques` → panier → `/checkout/paiement`.
3. **Suivi commande** accessible : client connecté sur `/mes-commandes` avec au moins une commande livrée de test.

Copy waitlist : « Besoin d’aide pour votre premier achat ? » — pas de message « coming soon ».

## Architecture

Page assembleur : [`app/(site)/page.tsx`](../app/(site)/page.tsx) — layout `(site)` avec header + footer.

Sections : `app/site/components/landing/*`

## Analytics

[`lib/analytics.ts`](../lib/analytics.ts) — `trackEvent()` ; no-op sans `NEXT_PUBLIC_ANALYTICS_PROVIDER` (`plausible` | `ga4`).

## Témoignages publics

Les avis seed (`isDemo: true`) sont exclus de `GET /public/testimonials` en prod.  
Dev uniquement : `INCLUDE_DEMO_TESTIMONIALS=true` **et** `NODE_ENV !== production`.

## Redirect `/coming-soon`

- **302** dans [`middleware.ts`](../middleware.ts) — temporaire.
- **301** après audit des liens internes et validation produit (backlog).
