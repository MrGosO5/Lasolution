# IAM — spécification (implémentation progressive)

## Rôles

| Rôle            | Accès typique                          |
|-----------------|----------------------------------------|
| `admin`         | Dashboard, validation, factures        |
| `client`        | Espace client, commandes, paiements   |
| `relais`        | Point relais, scan colis               |
| `solupacker`    | Annonces vol, missions                 |
| `solu_livreur`  | Courses, shifts, preuve livraison      |
| `ambassadeur`   | Commissions, messages, wallet          |

## Auth actuelle (dev)

- **NextAuth** + backend Express `POST /auth/login`.
- Mots de passe via variables d’environnement : `ADMIN_*`, `CLIENT_PASSWORD`, `PARTNER_PASSWORD` (mot de passe partagé partenaires en dev).

## Implémenté dans le repo (socle API)

- **`POST /auth/login`** : upsert `User` en base, enregistrement **`SecurityEvent`** (`login_ok` / `login_fail`), émission **`accessToken`** (JWT, `API_JWT_SECRET`) + **`refreshToken`** (opaque, table `RefreshToken`) si PostgreSQL disponible.
- **`POST /auth/refresh`** : rotation refresh (révocation de l’ancien jeton).
- **RBAC** sur routes métier : header `Authorization: Bearer <accessToken>`.
- **Rate limit** léger en mémoire sur `/auth/login` (à remplacer par Redis en prod).

## Évolutions prévues

- Hash **Argon2id** en base (`User.passwordHash`) via Prisma.
- **MFA** TOTP pour admin (option `MFA_REQUIRED_ROLES`).
- **OAuth** Google/Apple : table `OAuthAccount`.

## Rate limiting (cible prod)

- Redis sur `/auth/login` + politiques par IP / compte.
