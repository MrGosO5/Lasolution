# Chiffrement des données sensibles au repos

## Clé

Variable : `DATA_ENCRYPTION_KEY` (32 octets, encodage base64) dans `.env.local`.

Génération : `openssl rand -base64 32`

**Ne jamais** faire tourner la clé sans script de re-chiffrement des données existantes.

## Format stocké

`enc:v1:{iv}:{tag}:{ciphertext}` (AES-256-GCM)

Implémentation : [`backend/src/crypto/fieldEncryption.js`](../backend/src/crypto/fieldEncryption.js)

## Champs concernés (phase actuelle)

| Modèle / champ | Priorité | Statut |
|----------------|----------|--------|
| `User.profile.phone` | Haute | Chiffré à l'écriture, déchiffré à la lecture |
| `KycSubmission.payload` | Haute | À étendre (même module) |
| `Address.phone`, `line1` | Moyenne | À étendre |

## Migration des données existantes

Script one-shot recommandé avant prod :

```bash
cd backend
node scripts/migrate-encrypt-profiles.js
```

(À exécuter une fois `DATA_ENCRYPTION_KEY` est défini.)

## Comportement sans clé

Si `DATA_ENCRYPTION_KEY` est absent, les champs sont stockés en clair (mode dev). En production, définir la clé est **obligatoire** pour les données sensibles.
