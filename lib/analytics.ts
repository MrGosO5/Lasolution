export type AnalyticsEventName =
  | "landing_cta_boutiques"
  | "landing_cta_expedition"
  | "landing_cta_connexion"
  | "landing_cta_inscription"
  | "landing_cta_espace"
  | "landing_cta_tracking"
  | "landing_waitlist_submit"
  | "landing_cta_services";

type AnalyticsProps = Record<string, string | number | boolean | undefined>;

/** Couche fine — no-op sans provider ; brancher Plausible / GA4 via NEXT_PUBLIC_ANALYTICS_* plus tard. */
export function trackEvent(name: AnalyticsEventName, props?: AnalyticsProps): void {
  if (typeof window === "undefined") return;

  const provider = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER?.trim();
  if (process.env.NODE_ENV !== "production") {
    console.debug("[analytics]", name, props ?? {});
  }

  if (!provider) return;

  const w = window as Window & {
    plausible?: (event: string, opts?: { props?: AnalyticsProps }) => void;
    gtag?: (...args: unknown[]) => void;
  };

  if (provider === "plausible" && w.plausible) {
    w.plausible(name, props ? { props } : undefined);
    return;
  }

  if (provider === "ga4" && w.gtag) {
    w.gtag("event", name, props ?? {});
  }
}
