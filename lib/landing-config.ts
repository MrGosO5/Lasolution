/**
 * Feature flags landing `/` — voir docs/landing-evolution.md pour critères de retrait waitlist.
 *
 * Retirer la waitlist (LANDING_SHOW_WAITLIST=false) quand :
 * 1. Inscription opérationnelle (POST /api/register + NextAuth)
 * 2. Parcours /boutiques → panier → /checkout/paiement utilisable
 * 3. Suivi /mes-commandes accessible pour un client avec commande livrée
 */

function readFlag(name: string, defaultValue: boolean): boolean {
  const v = process.env[name]?.trim().toLowerCase();
  if (v === "true") return true;
  if (v === "false") return false;
  return defaultValue;
}

const isProd = process.env.NODE_ENV === "production";

export const landingConfig = {
  /** Désactivé par défaut en prod ; activable en dev sans env explicite. */
  showWaitlist: readFlag("LANDING_SHOW_WAITLIST", !isProd),
  showTracking: readFlag("LANDING_SHOW_TRACKING", true),
  showTestimonials: readFlag("LANDING_SHOW_TESTIMONIALS", true),
  showNotificationDemo: readFlag("LANDING_SHOW_NOTIFICATION_DEMO", true),
} as const;
