import type { Metadata } from "next";
import { ComingSoonContent } from "./ComingSoonContent";

export const metadata: Metadata = {
  title: "Bientôt disponible",
  description:
    "Votre passerelle d’achat assisté et d’expédition de colis. Tout ce que vous aimez à l’étranger, livré chez vous en toute sérénité.",
  openGraph: {
    title: "La Solution — Coming Soon",
    description: "Achat assisté et expédition internationale.",
  },
};

export default function ComingSoonPage() {
  return <ComingSoonContent />;
}
