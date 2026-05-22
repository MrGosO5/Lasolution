/**
 * Textes alignés sur la maquette PDF « Commin soon.pdf » (export La solution).
 * Node Figma de référence : docs/figma-alignment.md
 */

export const comingSoonCopy = {
  hero: {
    kicker: "Coming Soon",
    title: "Votre passerelle d'achat assisté et d'expédition de colis.",
    subtitle: "Profitez des avantages de La Solution en faisant vos achats dès maintenant",
    cta: "Faites votre demande",
    /** Icônes circulaires sous le CTA — maquette — fichiers dans `public/coming-soon/` */
    retailerIcons: [
      { src: "/coming-soon/retailer-amazon.png", alt: "Amazon" },
      { src: "/coming-soon/retailer-shein.png", alt: "Shein" },
      { src: "/coming-soon/retailer-temu.png", alt: "Temu" },
      { src: "/coming-soon/retailer-ikea.png", alt: "IKEA" },
      { src: "/coming-soon/retailer-rakuten.png", alt: "Rakuten" },
      { src: "/coming-soon/retailer-play.png", alt: "Multimédia" },
      { src: "/coming-soon/retailer-aliexpress.png", alt: "AliExpress" },
      { src: "/coming-soon/retailer-megaphone.png", alt: "Communication" },
    ],
  },
  offers: {
    sectionTitle: "Qu'offrons nous à nos clients ?",
    sectionLead: "Nous nous occupons de tout, ne vous souciez plus",
    cards: [
      {
        title: "Vous avez besoin d'un article.",
        body: "Faites vos commandes dans une boutique sans hésiter.",
      },
      {
        title: "La Solution devient votre allié de marque pour tous vos achats et expéditions.",
        body: "",
      },
      {
        title: "Nous vous expédions vos articles par voie aérienne ou maritime, selon votre choix.",
        body: "",
      },
      {
        title: "La Solution se charge également de vous livrer jusqu'à votre domicile.",
        body: "",
      },
    ],
    /** Visuels maquette — fichiers dans `public/coming-soon/` */
    cardImages: [
      {
        src: "/coming-soon/offer-1-achat.png",
        alt: "Client souriant devant un ordinateur portable, pensant à son achat.",
      },
      {
        src: "/coming-soon/offer-2-marque.png",
        alt: "Ordinateur portable affichant le logo La Solution et la mention simplifiez votre quotidien.",
      },
      {
        src: "/coming-soon/offer-3-aerien-maritime.png",
        alt: "Avion au-dessus d'un porte-conteneurs : transport aérien et maritime.",
      },
      {
        src: "/coming-soon/offer-4-livraison.png",
        alt: "Livreur remettant un colis carton à un client.",
      },
    ],
  },
  reasons: {
    sectionTitle: "Pourquoi nous choisir ?",
    bullets: [
      "Service 100% sécurisé",
      "Regroupement de colis pour réduire les frais",
      "Livraison rapide et suivie",
      "Support client réactif",
      "Aide à l'achat dans vos boutiques préférées",
      "Et bien d'autres avantages",
    ],
  },
  form: {
    title: "Ne perdez plus de temps. Passez à la vitesse supérieure",
    subtitle: "Nous prenons tout en charge jusqu'à votre destination",
    tabBuyer: "Achat assisté",
    tabPro: "Expédition de colis",
    /** Figma Frame 74 — onglet « Achat assisté » */
    instruction:
      "Veuillez renseigner les liens de vos articles récupérés depuis la boutique (ex: Alibaba, Temu, AliExpress ou autre)",
    urlLabel: "Lien(s) de vos articles",
    urlPlaceholder: "https://...\nhttps://...",
    nameLabel: "Nom & Prénom",
    namePlaceholder: "Jean Dupont",
    emailLabel: "Email",
    emailPlaceholder: "vous@exemple.com",
    phoneLabel: "Numéro de téléphone",
    phoneDialAria: "Pays et indicatif téléphonique",
    /** Figma Frame 75 — onglet « Expédition de colis » */
    instructionPro:
      "Veuillez renseigner vos informations pour pouvoir profiter de nos services. Nous vous répondons dans peu de temps.",
    submit: "Soumettre ma demande",
    submitSending: "Envoi en cours…",
    submitError: "Enregistrement impossible. Réessayez.",
    submitNetworkError: "Réseau indisponible.",
    success:
      "Merci ! Votre demande est bien enregistrée. Nous vous recontactons bientôt aux coordonnées indiquées. Vous ne recevez pas d’e-mail automatique de confirmation à cette étape.",
  },
  testimonials: {
    sectionTitle: "Témoignages",
    sectionLead: "Faites vos achats ou envoyez un colis à vos proches en toute confiance, on s'occupe de tout.",
    items: [
      {
        name: "André",
        location: "Cotonou, Bénin",
        quote:
          "J'ai commandé un sac en Europe, et je l'ai reçu en 10 jours à Cotonou. Le suivi était clair, et le service client super réactif. Je recommande à 100 %",
      },
      {
        name: "Aïcha",
        location: "Lomé, Togo",
        quote:
          "Le service d'achat assisté est juste génial. Je choisis ce que je veux, ils commandent et je reçois tout sans stress. C'est comme avoir un ami sur place",
      },
      {
        name: "Hamid",
        location: "Paris, France",
        quote:
          "En tant que SoluPacker, je gagne de l'argent en rentrant chez moi. L'application est bien faite, et les paiements sont rapides.",
      },
      {
        name: "Chantal",
        location: "Abidjan, Côte d'Ivoire",
        quote:
          "J'ai reçu ma commande sans souci, livrée par un partenaire relais près de chez moi. Très pratique et sécurisé !",
      },
      {
        name: "Jean-Marc",
        location: "Bruxelles, Belgique",
        quote:
          "Une vraie passerelle entre l'Europe et l'Afrique. J'ai pu expédier mes colis sans passer par les services classiques, et avec beaucoup plus de souplesse.",
      },
      {
        name: "Fatou",
        location: "Dakar, Sénégal",
        quote:
          "J'ai pu envoyer un colis à ma famille en toute simplicité. J'ai adoré la possibilité de suivre chaque étape, et les frais étaient raisonnables.",
      },
    ],
  },
  footer: {
    newsletterTitle: "Faites partie des premiers à utiliser La Solution",
    emailPlaceholder: "Entrez votre email",
    subscribe: "Notifiez moi",
    newsletterSuccess: "Merci, vous serez notifié(e) au lancement.",
    newsletterError: "Inscription impossible pour le moment.",
    newsletterNetworkError: "Réseau indisponible.",
    legal:
      "© La Solution - 2025, Votre partenaire de confiance pour l'achat et l'expédition à l'international.",
    backToSite: "Retour au site",
  },
} as const;

/** @deprecated Utiliser `phoneDialOptions` depuis `@/lib/phone-dial-options` */
export { phoneDialOptions as comingSoonPhoneDialOptions } from "@/lib/phone-dial-options";
