# Sécurisation du site avec mot de passe (portail d’aperçu)

Ce document décrit le **portail d’accès** qui protège l’application Next.js derrière un mot de passe local ou de préproduction, sans remplacer **NextAuth** (connexion utilisateur métier).

## Objectif

- Limiter l’accès au site (toutes les routes applicatives) lorsque vous exposez une instance (localhost, préprod, démo).
- Le visiteur saisit **un seul mot de passe partagé** ; après validation, le navigateur reçoit un **cookie signé** et n’est plus redirigé vers le formulaire tant que le cookie est valide.

Ce mécanisme est **complémentaire** à la connexion `/connexion` : il s’agit d’une barrière « site fermé », pas d’un compte utilisateur.

## Activation et désactivation

| Situation | Comportement |
|-----------|----------------|
| `SITE_PREVIEW_PASSWORD` absent, vide, ou **moins de 8 caractères** | Portail **désactivé** ; le site se comporte comme avant. |
| `SITE_PREVIEW_PASSWORD` défini avec **au moins 8 caractères** | Portail **activé** pour toutes les routes couvertes par le middleware (sauf exclusions listées ci‑dessous). |

Variables à définir dans **`.env.local`** (ou variables d’environnement du déploiement) :

| Variable | Rôle |
|----------|------|
| `SITE_PREVIEW_PASSWORD` | Mot de passe attendu (≥ 8 caractères). **Ne jamais commiter** ce fichier. |
| `SITE_PREVIEW_SECRET` | Secret utilisé pour calculer le jeton cookie (HMAC). **Recommandé** : valeur longue et aléatoire (ex. 32 octets en hex). |
| `NEXTAUTH_SECRET` | Si `SITE_PREVIEW_SECRET` est absent, le portail réutilise ce secret pour le HMAC (moins isolé, mais pratique si déjà configuré). |

Si le portail est activé (`SITE_PREVIEW_PASSWORD` OK) mais qu’**aucun** secret n’est disponible (`SITE_PREVIEW_SECRET` et `NEXTAUTH_SECRET` vides), le middleware **ne bloque pas** (évite un verrouillage total). L’API `POST /api/site-preview` renverra alors une erreur de configuration si quelqu’un tente quand même de se connecter au formulaire.

Après toute modification des variables, **redémarrer** le serveur Next (`npm run dev` ou process de prod).

## Fichiers concernés

- `lib/site-preview.ts` — Détection d’activation, secret, calcul et vérification du jeton, chemins exclus.
- `middleware.ts` — Redirection vers `/acces-preview` si cookie invalide ou absent ; ensuite logique NextAuth existante (dashboard, espace client, etc.).
- `app/acces-preview/page.tsx` — Page de saisie du mot de passe.
- `app/api/site-preview/route.ts` — `POST` avec corps JSON `{ "password": "…" }` : vérifie le mot de passe, pose le cookie.

## Déroulement côté utilisateur

1. L’utilisateur ouvre une URL du site (ex. `/`).
2. Le middleware vérifie la présence et la validité du cookie `lasolution_site_preview`.
3. Si ce n’est pas bon : redirection vers **`/acces-preview?callbackUrl=…`** (l’URL demandée est conservée pour y revenir après succès).
4. L’utilisateur envoie le mot de passe ; l’API répond en posant le cookie puis le client redirige vers `callbackUrl`.

## Pourquoi le mot de passe n’est plus demandé tout de suite ?

Ce n’est **pas** le mot de passe qui est stocké dans le navigateur.

Après une saisie correcte, le serveur envoie un cookie **`lasolution_site_preview`** dont la valeur est un **jeton dérivé** (HMAC-SHA256 d’un message fixe avec votre `SITE_PREVIEW_SECRET` ou `NEXTAUTH_SECRET`). Le mot de passe en clair n’apparaît que dans le corps de la requête POST, une fois.

Propriétés du cookie (voir `app/api/site-preview/route.ts`) :

- **httpOnly** : inaccessible au JavaScript des pages (réduit le risque de vol par XSS).
- **sameSite: lax** : comportement standard pour une navigation depuis le même site.
- **secure** : activé uniquement en **production** (`NODE_ENV === "production"`) — en local HTTP, le cookie n’est pas marqué `Secure`.
- **maxAge** : **30 jours** (en secondes : `60 * 60 * 24 * 30`). Passé ce délai, ou si le cookie est supprimé, le mot de passe sera redemandé.

Comparaison du mot de passe côté serveur : les deux chaînes sont hachées en **SHA-256** puis comparées avec `timingSafeEqual` (limite les fuites par timing). Le mot de passe complet n’est pas stocké en clair côté client.

## Chemins exclus du contrôle portail

Sans cookie valide, ces chemins restent accessibles (sinon boucle ou assets cassés) :

- `/acces-preview`
- `/api/site-preview` (endpoint de validation)
- tout ce qui commence par `/api/auth` (NextAuth)
- `/_next/…` (bundles Next)
- `/favicon.ico`
- fichiers dont l’URL se termine par des extensions courantes : `.svg`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.ico`, `.woff`, `.woff2`

Le **matcher** du middleware exclut en outre `_next/static`, `_next/image` et le favicon via le motif de configuration.

## Changer le mot de passe ou révoquer l’accès

- **Changer le mot de passe** : mettre à jour `SITE_PREVIEW_PASSWORD` dans `.env.local` et redémarrer. Les personnes déjà connectées via l’ancien cookie **restent** acceptées tant que le **secret HMAC** n’a pas changé (le jeton ne contient pas le mot de passe). Pour forcer tout le monde à resaisir le nouveau mot de passe, changez aussi **`SITE_PREVIEW_SECRET`** (ou `NEXTAUTH_SECRET` s’il servait de fallback) : tous les anciens jetons deviennent invalides.
- **Déconnexion « portail »** pour un navigateur : supprimer les cookies du site (outils développeur ou paramètres du navigateur) pour ce domaine / ce port.
- **Désactiver complètement** le portail : retirer ou vider `SITE_PREVIEW_PASSWORD`, ou le mettre à moins de 8 caractères, puis redémarrer.

## Générer des secrets forts (exemples)

Mot de passe (base64 URL-safe, 24 octets aléatoires) :

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
```

Secret dédié au cookie (32 octets en hex) :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Limites et bonnes pratiques

- Ce dispositif protège surtout contre **l’accès opportuniste** (lien partagé, moteurs de recherche sur une préprod). Ce n’est **pas** un remplacement d’une authentification forte ni d’un contrôle réseau (VPN, IP allowlist, Basic Auth reverse proxy).
- Ne **commitez pas** `.env.local` ; en CI / production, injectez les variables via le hébergeur.
- En **HTTPS** en production, le cookie `secure` est cohérent avec une exposition publique.

## Raccourcir la durée de session portail

La durée est fixée par `maxAge` dans `app/api/site-preview/route.ts`. Pour exiger une resaisie plus souvent (par exemple 8 heures), réduire cette valeur (en secondes) et redéployer.
