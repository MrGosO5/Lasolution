# IAM — spécification (état implémenté)

## Rôles

| Rôle            | Accès typique                          |
|-----------------|----------------------------------------|
| `admin`         | Dashboard, validation, factures        |
| `client`        | Espace client, commandes, paiements   |
| `relais`        | Point relais, scan colis               |
| `solupacker`    | Annonces vol, missions                 |
| `solu_livreur`  | Courses, shifts, preuve livraison      |
| `ambassadeur`   | Commissions, messages, wallet          |

## Socle implémenté

- **NextAuth** (Credentials + Google optionnel) + backend Express.
- **Argon2id** pour les nouveaux mots de passe ; re-hash lazy depuis PBKDF2 au login.
- **`POST /auth/login`** : verrouillage compte, rate limit IP + email, MFA TOTP si `MFA_REQUIRED_ROLES`, Turnstile après échecs.
- **`POST /auth/register`** : politique MDP (12+ car., liste locale + HIBP), Turnstile, email de vérification.
- **`POST /auth/logout`** : révocation refresh + `SecurityEvent` `logout`.
- **`POST /auth/refresh`** : rotation + rate limit.
- **`GET/DELETE /auth/sessions`** : gestion des appareils connectés.
- **Vérification email** : connexion OK ; `POST /orders` bloqué si `emailVerifiedAt` null.
- **Reset password** : tokens hashés, révocation sessions, Turnstile si abus.
- **RBAC** : `requireAuth` + `requireRoles` ; rate limit Redis (fallback mémoire).
- **OAuth** : `POST /auth/oauth/sync` + table `OAuthAccount` (Google si variables définies).

## Variables clés

| Variable | Usage |
|----------|--------|
| `API_JWT_SECRET` | JWT API (15 min) |
| `NEXTAUTH_SECRET` | Session NextAuth |
| `AUTH_ENV_FALLBACK` | `false` en prod (désactive login env) |
| `MFA_REQUIRED_ROLES` | ex. `admin` |
| `TURNSTILE_SECRET_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | CAPTCHA |
| `DATA_ENCRYPTION_KEY` | Chiffrement téléphone profil |
| `OAUTH_INTERNAL_SECRET` | Sync OAuth backend |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth Google (optionnel) |

## Documentation associée

- [`auth-cookies-policy.md`](./auth-cookies-policy.md)
- [`runbook-rotation-secrets.md`](./runbook-rotation-secrets.md)
- [`data-encryption.md`](./data-encryption.md)
- [`infra_prod.md`](./infra_prod.md)
