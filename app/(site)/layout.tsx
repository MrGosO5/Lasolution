import { SiteFooter } from "@/app/site/components/SiteFooter";
import { SiteHeader } from "@/app/site/components/SiteHeader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "La Solution",
    template: "%s · La Solution",
  },
  description: "Votre passerelle d’expédition de colis et d’achat assisté.",
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}

