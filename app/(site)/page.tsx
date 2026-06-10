import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { PublicTestimonialsSection } from "@/app/site/components/PublicTestimonialsSection";
import { LandingFeaturesSection } from "@/app/site/components/landing/LandingFeaturesSection";
import { LandingHeroSection } from "@/app/site/components/landing/LandingHeroSection";
import { LandingStructuredData } from "@/app/site/components/landing/LandingStructuredData";
import { LandingWaitlistSection } from "@/app/site/components/landing/LandingWaitlistSection";
import { OrderTrackingPromo } from "@/app/site/components/landing/OrderTrackingPromo";
import { authOptions } from "@/lib/auth";
import { landingConfig } from "@/lib/landing-config";
import type { AppRole } from "@/types/app-role";

/** Témoignages issus de la BDD — pas de cache page statique. */
export const revalidate = 0;

const SITE_URL = process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "http://localhost:3001";

const title = "La Solution — Achat assisté et expédition Europe → Afrique";
const description =
  "Faites vos achats ou envoyez un colis depuis l’Europe vers l’Afrique. Achat assisté, paiement sécurisé, suivi en temps réel et support client intégré.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description,
    url: "/",
    siteName: "La Solution",
    locale: "fr_FR",
    type: "website",
    images: [{ url: "/icon.png", width: 512, height: 512, alt: "La Solution" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/icon.png"],
  },
  metadataBase: new URL(SITE_URL),
};

export default async function AccueilPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as AppRole | undefined;
  const isAuthed = Boolean(session?.user?.id);
  const isClient = role === "client";

  return (
    <>
      <LandingStructuredData />
      <main>
        <LandingHeroSection
          role={role}
          isAuthed={isAuthed}
          showNotificationDemo={landingConfig.showNotificationDemo}
        />
        <LandingFeaturesSection />
        {landingConfig.showTracking ? <OrderTrackingPromo isClient={isClient} /> : null}
        {landingConfig.showWaitlist ? <LandingWaitlistSection /> : null}
        {landingConfig.showTestimonials ? <PublicTestimonialsSection /> : null}
      </main>
    </>
  );
}
