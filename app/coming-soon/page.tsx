import type { Metadata } from "next";
import { fetchApprovedTestimonials } from "@/lib/public-testimonials";
import { ComingSoonContent } from "./ComingSoonContent";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Bientôt disponible",
  description:
    "Votre passerelle d’achat assisté et d’expédition de colis. Tout ce que vous aimez à l’étranger, livré chez vous en toute sérénité.",
  openGraph: {
    title: "La Solution — Coming Soon",
    description: "Achat assisté et expédition internationale.",
  },
};

export default async function ComingSoonPage() {
  const testimonials = await fetchApprovedTestimonials(12);
  return <ComingSoonContent testimonials={testimonials} />;
}
