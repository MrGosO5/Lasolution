# Roadmap features — Lasolution

> Juillet 2026 · ✅ = fait · 🟡 = partiel · 📋 = pas encore

---

## Visiteur (non connecté)

- ✅ Landing `/` (hero, services, SEO, témoignages, waitlist)
- ✅ Pages : `/services`, `/faq`, `/support`, `/mentions-legales`, `/conditions-generales`, `/politique-de-confidentialite`
- ✅ Info partenaires : `/devenir-solupacker`, `/devenir-point-relai`
- ✅ Candidature SoluPacker (formulaire + upload docs)
- ✅ Candidature Point Relai (formulaire + upload docs)
- ✅ Contact support
- ✅ Waitlist / newsletter (EmailJS)
- ✅ Portail preview site (`/acces-preview` + mot de passe)

---

## Client

- ✅ Inscription `/inscription`
- ✅ Connexion `/connexion`
- ✅ Mot de passe oublié / reset
- ✅ Profil `/mon-profil`
- ✅ Paramètres (langue, devise, MDP) `/parametres`
- ✅ Hub compte `/mon-espace`
- ✅ Boutiques démo `/boutiques` (Amazon, AliExpress, TEMU, SHEIN)
- ✅ Panier (localStorage) `/panier`
- ✅ Checkout livraison AIR/SEA `/checkout/expedition-livraison`
- 🟡 Checkout paiement `/checkout/paiement` (commande créée, paiement réel non branché)
- ✅ Mes commandes `/mes-commandes` (liste + détail + timeline)
- ✅ Annulation commande
- ✅ Confirmation réception
- ✅ Avis post-livraison (note + photo)
- ✅ Mes avis `/mes-avis`
- ✅ Notifications `/notifications`
- ✅ Expédier un colis `/expedier-un-colis`
- ✅ Mes expéditions `/mes-expeditions` (liste, recherche, modale suivi / timeline)
- 🟡 Carte virtuelle `/carte` (UI seule)

---

## SoluPacker

- ✅ Espace dédié `/mon-espace`
- ✅ Déclaration prochain voyage `/prochain-voyage`
- ✅ Liste missions `/missions`
- ✅ Accepter / refuser mission
- ✅ Rapport réception colis
- ✅ Rapport récupération colis
- ✅ Candidature → compte créé après acceptation admin

---

## Point Relai

- ✅ Espace partenaire `/partenaire/relais`
- ✅ Candidature → compte créé après acceptation admin

---

## Solu Livreur

- ✅ Espace partenaire `/partenaire/livreur`
- ✅ Liste courses + accepter une course
- ✅ Gestion créneaux (shifts)

---

## Ambassadeur

- ✅ Espace partenaire `/partenaire/ambassadeur`
- ✅ Commissions journalières (wallet + ledger)

---

## Admin

- ✅ Dashboard KPI `/dashboard`
- ✅ Commandes : liste, détail, changement statut
- ✅ Colis : réception entrepôt, pesée, expédition, événements suivi
- ✅ Utilisateurs : liste clients, SoluPackers, Points Relais
- ✅ Demandes : candidatures SoluPacker + Point Relai (voir docs, accepter, refuser)
- ✅ Expéditions standalone `/dashboard/expeditions` (liste, modale gestion, suppression) — voir [`expeditions-standalone.md`](./expeditions-standalone.md)
- ✅ Avis : modération (approuver / rejeter)
- 🟡 Paramètres admin (UI seule)

---

## Système (transversal)

- ✅ Auth NextAuth + JWT backend + refresh auto
- ✅ 6 rôles : admin, client, relais, solupacker, solu_livreur, ambassadeur
- ✅ Emails SMTP (bienvenue, reset, statut commande, candidatures)
- ✅ Upload preuves commande + photos avis
- ✅ Upload docs candidatures (privé, admin only)
- ✅ Audit log + SecurityEvent
- ✅ Rate limiting login/register
- 🟡 Paiements Stripe / PSP (stub)
- 🟡 Zoho Books (stub)
- 🟡 Webhooks paiement (partiel)
- 📋 Wallet client / carte rechargeable
- 📋 Procurement conciergerie
- 📋 KYC, incidents, payouts auto, étiquettes transporteur
- 📋 Tests E2E

---

## Docs

- [`expeditions-standalone.md`](./expeditions-standalone.md) — demandes d’expédition hors commande (client + admin)
- [`phased-delivery.md`](./phased-delivery.md) — backlog phases
- [`infra_prod.md`](./infra_prod.md) — déploiement prod
