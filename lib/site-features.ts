export type SiteFeature = {
  title: string;
  desc: string;
};

export const SITE_FEATURES: SiteFeature[] = [
  {
    title: "Achat assisté",
    desc: "Vous choisissez le produit (Amazon, AliExpress, TEMU, SHEIN…), on s’occupe de l’achat, du contrôle et de l’expédition.",
  },
  {
    title: "Paiement",
    desc: "Payez en toute sécurité depuis l’Afrique. Vos transactions sont suivies et confirmées avec notifications.",
  },
  {
    title: "Suivi en temps réel",
    desc: "Suivez votre commande ou votre colis à chaque étape, jusqu’à la remise au point relai ou au destinataire final.",
  },
  {
    title: "Support client intégré",
    desc: "Une assistance réactive pour vos questions, litiges ou changements (adresse, mode d’expédition, disponibilité…).",
  },
];

export const LANDING_FEATURES_HEADLINE =
  "Une solution rapide, fiable pour transporter ou acheter depuis l’Europe vers l’Afrique.";
