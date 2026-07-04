export type StoreId = "amazon" | "aliexpress" | "temu" | "shein";

export type Store = {
  id: StoreId;
  name: string;
  subtitle: string;
  heroLine: string;
  logoSrc?: string;
};

export const STORES: Store[] = [
  {
    id: "amazon",
    name: "Amazon",
    subtitle: "Les meilleurs produits, livrés sans tracas.",
    heroLine: "Parcourez les meilleurs produits d’Amazon, et recevez-les chez vous sans tracas.",
    logoSrc: "/coming-soon/retailer-amazon.png",
  },
  {
    id: "aliexpress",
    name: "AliExpress",
    subtitle: "Des trouvailles à prix doux.",
    heroLine:
      "Parcourez les meilleurs produits de AliExpress, et recevez-les chez vous sans tracas.",
    logoSrc: "/coming-soon/retailer-aliexpress.png",
  },
  {
    id: "temu",
    name: "TEMU",
    subtitle: "Tendance et accessibles.",
    heroLine: "Parcourez les meilleurs produits de TEMU, et recevez-les chez vous sans tracas.",
    logoSrc: "/coming-soon/retailer-temu.png",
  },
  {
    id: "shein",
    name: "SHEIN",
    subtitle: "Mode & accessoires.",
    heroLine: "Parcourez les meilleurs produits de SHEIN, et recevez-les chez vous sans tracas.",
    logoSrc: "/coming-soon/retailer-shein.png",
  },
];

export function getStore(id: string) {
  return STORES.find((s) => s.id === id);
}

