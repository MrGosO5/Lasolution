# Runbook — rotation des secrets d'authentification

## `API_JWT_SECRET`

**Impact** : tous les `accessToken` existants deviennent invalides immédiatement.

1. Générer un secret fort (32+ octets) : `openssl rand -base64 32`
2. (Optionnel) Déployer avec `API_JWT_SECRET_PREVIOUS=<ancien>` pendant 15 minutes — le backend accepte les deux signatures (`backend/src/auth/tokens.js`)
3. Remplacer `API_JWT_SECRET` par le nouveau secret
4. Retirer `API_JWT_SECRET_PREVIOUS`
5. Les utilisateurs reconnectés via refresh obtiennent de nouveaux access tokens automatiquement

## `NEXTAUTH_SECRET`

**Impact** : toutes les sessions NextAuth (cookies) sont invalidées — reconnexion obligatoire.

1. Générer un nouveau secret
2. Mettre à jour `.env.local` sur le VPS
3. `pm2 restart lasolution-frontend`
4. Les refresh tokens backend restent valides sauf révocation explicite — prévoir le message `?session=expired` sur `/connexion`

## En cas de fuite suspectée

1. Rotation **immédiate** des deux secrets ci-dessus
2. Exécuter un script de révocation globale des refresh tokens (admin) :
   ```sql
   UPDATE "RefreshToken" SET "revokedAt" = NOW() WHERE "revokedAt" IS NULL;
   ```
3. Auditer `SecurityEvent` (`login_fail`, `account_locked`, `password_reset_*`)
4. Notifier les administrateurs par email

## Checklist post-rotation

- [ ] Frontend redémarré (`pm2 restart lasolution-frontend`)
- [ ] Backend redémarré (`pm2 restart lasolution-backend`)
- [ ] Connexion admin testée
- [ ] Checkout / `POST /orders` testé avec compte vérifié
