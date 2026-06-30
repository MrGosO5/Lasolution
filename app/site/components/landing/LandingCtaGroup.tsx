"use client";

import Link from "next/link";
import { SiteSignOutButton } from "@/app/site/components/SiteSignOutButton";
import { partnerPathByRole } from "@/lib/partner-routes";
import { TrackedLink } from "@/app/site/components/landing/TrackedLink";
import type { AppRole } from "@/types/app-role";

const PARTNER_ROLES: AppRole[] = ["relais", "solupacker", "solu_livreur", "ambassadeur"];

type Props = {
  role?: AppRole;
  isAuthed: boolean;
};

export function LandingCtaGroup({ role, isAuthed }: Props) {
  if (!isAuthed || !role) {
    return (
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-1">
        {/* Boutiques bientôt disponible — masqué pour le moment */}
        <TrackedLink href="/expedier-un-colis" className="btn btn-primary" event="landing_cta_expedition">
          Expédier un colis
        </TrackedLink>
        <TrackedLink href="/connexion" className="btn btn-ghost" event="landing_cta_connexion">
          Se connecter
        </TrackedLink>
        <TrackedLink href="/inscription" className="btn btn-ghost" event="landing_cta_inscription">
          S&apos;inscrire
        </TrackedLink>
      </div>
    );
  }

  if (role === "admin") {
    return (
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-1">
        <TrackedLink href="/dashboard" className="btn btn-primary" event="landing_cta_espace">
          Tableau de bord
        </TrackedLink>
        <SiteSignOutButton className="btn btn-ghost" callbackUrl="/">
          Se déconnecter
        </SiteSignOutButton>
      </div>
    );
  }

  if (role === "client") {
    return (
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-1">
        <TrackedLink href="/mes-commandes" className="btn btn-primary" event="landing_cta_espace">
          Mes commandes
        </TrackedLink>
        {/* Boutiques bientôt disponible — masqué pour le moment */}
        <TrackedLink href="/mon-espace" className="btn btn-ghost" event="landing_cta_espace">
          Mon espace
        </TrackedLink>
      </div>
    );
  }

  if (PARTNER_ROLES.includes(role)) {
    const partnerHref = partnerPathByRole[role] ?? "/mon-espace";
    return (
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-1">
        <TrackedLink href={partnerHref} className="btn btn-primary" event="landing_cta_espace">
          Mon espace partenaire
        </TrackedLink>
        <Link href="/faq" className="btn btn-ghost">
          FAQ
        </Link>
        <SiteSignOutButton className="btn btn-ghost" callbackUrl="/">
          Se déconnecter
        </SiteSignOutButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-1">
      <TrackedLink href="/mon-espace" className="btn btn-primary" event="landing_cta_espace">
        Mon espace
      </TrackedLink>
      <SiteSignOutButton className="btn btn-ghost" callbackUrl="/">
        Se déconnecter
      </SiteSignOutButton>
    </div>
  );
}
