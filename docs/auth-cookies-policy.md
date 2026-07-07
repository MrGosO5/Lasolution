# Politique de sécurité des cookies et jetons — La Solution

Document d'audit pour l'authentification Lasolution (NextAuth + API Express).

## Cookies navigateur

| Cookie / jeton | HttpOnly | Secure (prod) | SameSite | Durée | Notes |
|----------------|----------|---------------|----------|-------|-------|
| `next-auth.session-token` / `__Secure-next-auth.session-token` | oui | oui | Lax | 30 j max (1 j si « Rester connecté » décoché) | Session NextAuth (JWT chiffré) |
| `lasolution_site_preview` | oui | oui | Lax | configurable | Portail preview (distinct de l'auth utilisateur) |

Configuration explicite : [`lib/auth.ts`](../lib/auth.ts) (`cookies.sessionToken.options`).

## Jetons API backend

| Jeton | Stockage | Durée | Rotation |
|-------|----------|-------|----------|
| `accessToken` (JWT) | Bearer header / JWT NextAuth | 15 min (`JWT_ACCESS_TTL`) | Renouvelé via refresh |
| `refreshToken` (opaque) | JWT NextAuth httpOnly uniquement | 7 j (`JWT_REFRESH_DAYS`) | Rotation à chaque `/auth/refresh` ; révoqué au logout |

Le `refreshToken` n'est **jamais** exposé via `session.user` côté client.

## Révocation

- Logout : `POST /auth/logout` révoque le refresh courant + `SecurityEvent` `logout`
- Reset / changement MDP : révocation de **tous** les refresh tokens de l'utilisateur
- Sessions actives : `GET /auth/sessions`, `DELETE /auth/sessions/:id`

## Variables d'environnement

- `NEXTAUTH_SECRET` — secret NextAuth (distinct de `API_JWT_SECRET`)
- `API_JWT_SECRET` — signature JWT API
- `API_JWT_SECRET_PREVIOUS` — optionnel, fenêtre de rotation (15 min)

Voir aussi [`runbook-rotation-secrets.md`](./runbook-rotation-secrets.md).
