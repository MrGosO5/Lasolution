# Passation — Avis clients (témoignages)

Résumé des changements **avis / témoignages** et marche à suivre pour un autre dev.

Docs liées : [`admin-ops-backoffice.md`](./admin-ops-backoffice.md), schéma [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma).

---

## Fonctionnel

| Zone | Rôle |
|------|------|
| **Client** | 1 avis par commande **livrée** ; création / édition si non publié |
| **Admin** | Modération `PENDING` → `APPROVED` / `REJECTED` sur `/dashboard/avis` |
| **Public** | Accueil (`/`) : avis **APPROVED** et `isDemo: false` uniquement |

Le **client ne voit pas** le statut de modération (ni sur `/mes-avis`, ni sur le détail commande).

---

## BDD

- Modèle `OrderTestimonial` : `status` (`PENDING` \| `APPROVED` \| `REJECTED`), `rejectReason`, modération.
- Migration modération : `backend/prisma/migrations/20260528120000_testimonial_moderation/`
- Migration suivante (défauts Prisma) : `backend/prisma/migrations/20260528150047_avis/`

---

## Backend (port 4000)

| Route | Qui |
|-------|-----|
| `GET/POST/PATCH /orders/:id/testimonials` | Client |
| `GET /me/testimonials` | Client (liste de ses avis) |
| `GET/PATCH /admin/testimonials` | Admin |
| `GET /public/testimonials` | Public |

Fichiers clés :

- `backend/src/routes/testimonials.js`
- `backend/src/routes/ordersParcels.js` (enregistre aussi `GET /me/testimonials`)
- `backend/src/auth/normalizeClientAuth.js` — aligne le compte démo `client-demo`
- `backend/src/routes/authRoutes.js` — login DB avant fallback env + fusion compte démo

---

## Front Next.js

| Page / composant | Chemin |
|------------------|--------|
| Mes avis | `/mes-avis` |
| Avis sur commande | `/mes-commandes/[id]#avis` → `OrderTestimonialBlock` |
| Colonne avis | `MesCommandesOrdersTable` |
| Admin | `/dashboard/avis` |
| Accueil | `PublicTestimonialsSection` |
| Proxy API | `app/api/me/testimonials`, `app/api/admin/testimonials`, `app/api/public/testimonials` |

Auth SSR : `lib/lasolution-api.ts`, `lib/backend-access-token.ts` (refresh jeton ~15 min).

Header : liens actifs + pas de lien « Accueil » (`SiteHeaderNav.tsx`).

---

## Compte démo important

| Champ | Valeur |
|-------|--------|
| Email | `client@lasolution.demo` |
| Mot de passe | `client` (ou `CLIENT_PASSWORD` dans `.env.local`) |
| **ID utilisateur en BDD** | `client-demo` (pas `client-client@lasolution.demo`) |

Les commandes seed sont sur `userId = client-demo`. Après pull : **redémarrer le backend** + **se reconnecter** si les commandes n’apparaissent pas.

---

## Commandes à lancer (ordre)

Depuis la **racine** du repo (`.env.local` à la racine avec `DATABASE_URL`, `NEXTAUTH_SECRET`, `API_JWT_SECRET`) :

```bash
# 1. Dépendances
npm install
cd backend && npm install && cd ..

# 2. Migrations + client Prisma (depuis backend/)
cd backend
npm run db:env:sync
npm run db:migrate
npm run db:generate

# 3. Seeds (obligatoire dans cet ordre — depuis backend/ ou racine, voir ci-dessous)
npm run db:seed
npm run db:seed:demo-orders
npm run db:seed:demo-testimonials
cd ..
```

Depuis la **racine** — serveurs :

```bash
npm run backend:dev    # port 4000
npm run dev            # front (souvent 3001)
```

Équivalent racine pour les seeds démo :

```bash
npm run db:seed
npm run backend:seed:demo-orders
npm run backend:seed:demo-testimonials
```

---

## Vérification rapide

1. Admin : `adminlasolution@gmail.com` / mot de passe admin → `/dashboard/avis`
2. Client : `client@lasolution.demo` / `client` → `/mes-commandes` (9 commandes démo) et `/mes-avis` (4 avis démo)
3. Accueil : section témoignages (avis approuvés)

Backend joignable : `GET http://localhost:4000/health`

Si port 4000 occupé : arrêter l’ancien process Node avant `npm run backend:dev`.

---

## Pièges connus

- **Backend pas redémarré** → route `/me/testimonials` en 404 ou anciens logs debug.
- **Session client ancienne** → jeton avec mauvais `sub` ; déconnexion + reconnexion.
- **Conflit email** `client@lasolution.demo` : le login fusionne automatiquement vers `client-demo` (voir `normalizeClientAuth.js`).
- **Prisma** : toujours passer par `npm run db:migrate` dans `backend/`, pas `npx prisma` seul sans `backend/.env`.

---

## Fichiers modifiés (repère git)

`backend/prisma/schema.prisma`, `backend/src/routes/testimonials.js`, `backend/src/routes/ordersParcels.js`, `backend/src/routes/authRoutes.js`, `backend/src/auth/*`, `app/(site)/mes-avis/`, `app/(site)/mes-commandes/*`, `app/site/components/OrderTestimonialBlock.tsx`, `app/dashboard/avis/`, `lib/lasolution-api.ts`, `lib/backend-access-token.ts`, `middleware.ts` (routes protégées `/mes-avis`).
