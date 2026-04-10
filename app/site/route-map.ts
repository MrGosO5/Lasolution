export type SiteRoute = {
  path: string;
  title: string;
  pdfScreens: string[];
  notes?: string;
};

/**
 * Mapping "URL -> écrans PDF" (Frame site.pdf).
 * Objectif: pouvoir implémenter chaque écran page par page.
 */
export const SITE_ROUTES: SiteRoute[] = [
  {
    path: "/",
    title: "Accueil (landing)",
    pdfScreens: ["Landing / Accueil"],
    notes:
      "Hero + CTA, sections features, bloc 'Suivez votre commande', témoignages, footer.",
  },
  {
    path: "/services",
    title: "Services",
    pdfScreens: ["Landing / Services (sections)"],
    notes: "Page dédiée reprenant les 4 piliers + expédition + achat assisté.",
  },
  {
    path: "/faq",
    title: "FAQ",
    pdfScreens: ["FAQ"],
  },
  {
    path: "/politique-de-confidentialite",
    title: "Politique de confidentialité",
    pdfScreens: ["Lien footer: Politique de confidentialité"],
    notes: "Le PDF liste le lien; contenu à compléter (texte légal).",
  },
  {
    path: "/support",
    title: "Support client",
    pdfScreens: ["Lien footer: Support client"],
    notes: "Formulaire → POST /api/support → backend POST /public/contact (SecurityEvent + email SMTP si configuré).",
  },
  {
    path: "/devenir-point-relai",
    title: "Devenez Partenaire Point Relai",
    pdfScreens: ["Devenez Partenaire Point Relai (page info)"],
  },
  {
    path: "/devenir-point-relai/demande",
    title: "Demande Point Relai (multi-étapes)",
    pdfScreens: [
      "Formulaire Point Relai — Informations personnelles",
      "Formulaire Point Relai — Informations du point relais",
      "Formulaire Point Relai — Autres infos / Documents",
      "Formulaire Point Relai — Confirmation / Contrat",
    ],
    notes:
      "POST /api/partner-relay-application → SecurityEvent partner_relay_application + email équipe. Uploads PDF/photos à venir.",
  },
  {
    path: "/inscription",
    title: "Créer un compte",
    pdfScreens: ["Création de compte"],
    notes: "POST /api/register → backend POST /auth/register (User client + mot de passe PBKDF2).",
  },
  {
    path: "/connexion",
    title: "Connexion (site)",
    pdfScreens: ["Connexion"],
    notes: "On pourra rediriger vers /login (NextAuth) ou harmoniser l'UI.",
  },
  {
    path: "/mot-de-passe-oublie",
    title: "Mot de passe oublié (demande code)",
    pdfScreens: ["Mot de passe oublié — Email"],
  },
  {
    path: "/mot-de-passe-oublie/code",
    title: "Mot de passe oublié (code)",
    pdfScreens: ["Mot de passe oublié — Code de réinitialisation"],
  },
  {
    path: "/mot-de-passe-oublie/nouveau",
    title: "Mot de passe oublié (nouveau mot de passe)",
    pdfScreens: ["Mot de passe oublié — Nouveau mot de passe"],
  },
  {
    path: "/boutiques",
    title: "Boutiques (hub)",
    pdfScreens: ["Boutiques (catalog)"],
    notes: "Menu: Accueil / Boutiques / Mon espace / FAQ.",
  },
  {
    path: "/boutiques/amazon",
    title: "Boutique Amazon",
    pdfScreens: ["Boutiques Amazon"],
    notes: "Recherche produit côté client (filtre sur la liste démo).",
  },
  {
    path: "/boutiques/aliexpress",
    title: "Boutique AliExpress",
    pdfScreens: ["Boutiques AliExpress"],
  },
  {
    path: "/boutiques/temu",
    title: "Boutique TEMU",
    pdfScreens: ["Boutiques TEMU"],
  },
  {
    path: "/boutiques/shein",
    title: "Boutique SHEIN",
    pdfScreens: ["Boutiques SHEIN"],
  },
  {
    path: "/panier",
    title: "Panier",
    pdfScreens: ["Panier"],
  },
  {
    path: "/checkout/paiement",
    title: "Paiement",
    pdfScreens: ["Paiement"],
  },
  {
    path: "/checkout/expedition-livraison",
    title: "Expédition & livraison",
    pdfScreens: ["Expédition & livraison (choix mode + infos livraison)"],
  },
  {
    path: "/expedier-un-colis",
    title: "Expédition de colis",
    pdfScreens: ["Expédition de colis"],
  },
  {
    path: "/notifications",
    title: "Notifications",
    pdfScreens: ["Notifications"],
  },
  {
    path: "/mon-profil",
    title: "Mon profil",
    pdfScreens: ["Mon profil"],
    notes: "GET /me + PATCH /api/me → User.profile JSON (nom, téléphone, adresse). Connexion requise + jeton API.",
  },
  {
    path: "/mon-espace",
    title: "Mon espace (hub par rôle)",
    pdfScreens: [
      "Déclarer prochain voyage",
      "Mes missions",
      "Détail mission",
      "Réception de colis",
      "Récupération de colis",
      "Mission annulée / confirmations",
    ],
    notes:
      "Hub implémenté : client (raccourcis compte), SoluPacker (missions, voyage, expédition, partenaire), autres partenaires (lien espace dédié).",
  },
  {
    path: "/mes-commandes",
    title: "Mes commandes (client)",
    pdfScreens: ["Mes commandes", "Détail commande + timeline + modales"],
  },
  {
    path: "/mes-commandes/[id]/annuler",
    title: "Annuler commande (confirmation)",
    pdfScreens: ["Modal annulation commande", "Commande annulée avec succès"],
  },
  {
    path: "/mes-commandes/[id]/confirmer-livraison",
    title: "Confirmer livraison (confirmation)",
    pdfScreens: ["Modal confirmer livraison"],
  },
  {
    path: "/mes-commandes/[id]/payer-expedition",
    title: "Payer expédition",
    pdfScreens: ["Paiement expédition prêt (CTA payer expédition)"],
  },
  {
    path: "/mes-commandes/[id]/payer-livraison",
    title: "Payer livraison",
    pdfScreens: ["Paiement livraison prêt (CTA payer livraison)"],
  },
  {
    path: "/carte",
    title: "Carte de paiement",
    pdfScreens: ["Activer votre carte", "Ma carte", "Historique", "Recharger", "Retirer"],
  },
  {
    path: "/parametres",
    title: "Paramètres",
    pdfScreens: ["Paramètres", "Changer mot de passe", "Changer langue/devise"],
    notes:
      "Mot de passe: POST /api/me/password (comptes avec passwordHash). Langue/devise: PATCH /api/me (clés language, currency dans profile).",
  },
];

