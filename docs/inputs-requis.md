# Ce dont l’équipe / le produit doit fournir pour aller plus loin

Ce fichier liste les **inputs externes** que le code ne peut pas inventer. Indiquez « OK » + les valeurs (ou « N/A ») quand c’est tranché.

## Décisions métier (toi / direction)

| Sujet | Question |
|--------|-----------|
| **PSP principal Afrique** | Quel agrégateur (ou opérateur direct) pour Bénin / Togo / Gabon — contrat signé ? |
| **PSP cartes / EUR** | Stripe, Adyen, autre — entité légale et pays d’activation ? |
| **Transporteur** | Qui expédie France → Afrique + dernier km ? Accès API / sandbox ? |
| **Wallet vs carte** | Option A (wallet interne) ou B (carte émise) — voir `DECISIONS.md`. |
| **Preuve livraison** | Relais : scan seul ou + code ? Livreur : QR + code confirmé ? |

## Secrets & accès techniques (à transmettre de façon sécurisée)

| Élément | Usage dans le repo |
|---------|---------------------|
| **`STRIPE_SECRET_KEY`** | API Stripe (hors webhook, ex. PaymentIntents réels). |
| **`STRIPE_WEBHOOK_SECRET`** | Vérification signature sur `POST /webhooks/psp/stripe`. |
| **Clés agrégateur Afrique** | Selon PSP choisi (Flutterwave, Paystack, etc.). |
| **Zoho Books** | OAuth client id/secret, org ID, scopes facturation. Voir `docs/integrations-airtable.md`. |
| **Airtable** | `AIRTABLE_PAT`, `AIRTABLE_BASE_ID`, table `Colis`, record QR `recn3WIQZNHBhmAhU`. |
| **SMTP / SendGrid / Twilio** | Emails transactionnels, SMS OTP livraison. |
| **S3 / bucket prod** | PDF factures, étiquettes, KYC (au-delà de MinIO dev). |
| **`API_JWT_SECRET` + `NEXTAUTH_SECRET`** | Déjà requis ; en prod : secrets forts distincts, rotation planifiée. |

## Infra & URLs

| Élément | Exemple de besoin |
|---------|-------------------|
| **URL publique API** | Pour webhooks PSP (HTTPS obligatoire en prod). |
| **`INTERNAL_AUTH_API_URL`** | Côté Next.js **dans Docker** : ex. `http://backend:4000` pour les appels SSR vers l’API. |
| **`AUTH_API_URL`** | Côté navigateur / callbacks : ex. `http://localhost:4000` en local. |
| **Registre d’images** | Si vous voulez un job CI **push** des images (GHCR, ECR, etc.) — URL + credentials registry. |

## Conformité & contenu

| Élément | Détail |
|---------|--------|
| **CGV / mentions paiement** | Délais d’encaissement, remboursements, pays couverts. |
| **RGPD** | Durées de conservation, point de contact DPO si applicable. |
| **KYC partenaires** | Niveau requis (manuel vs fournisseur type Onfido, etc.). |

---

**Prochaine étape utile de ta part** : répondre par priorités (MVP corridor) aux **5 lignes « Décisions métier »**, puis transmettre au moins **un jeu de clés sandbox** (Stripe ou agrégateur retenu) pour remplacer les stubs.
