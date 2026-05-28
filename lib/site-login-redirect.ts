import { partnerPathByRole } from "@/lib/partner-routes";
import type { AppRole } from "@/types/app-role";

const LOGIN_PATHS = new Set(["/connexion", "/login"]);

function pathnameOnly(pathOrUrl: string): string {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    try {
      return new URL(pathOrUrl).pathname;
    } catch {
      return pathOrUrl;
    }
  }
  const q = pathOrUrl.indexOf("?");
  return q === -1 ? pathOrUrl : pathOrUrl.slice(0, q);
}

/**
 * Évite de renvoyer sur une page login après succès (boucle header connecté + formulaire).
 * Rejette les URLs absolues hors origine du site.
 */
export function sanitizeSiteLoginCallback(
  raw: string | null,
  siteOrigin: string,
): string {
  const fallback = "/mon-espace";
  if (raw == null || raw.trim() === "" || raw === "/") return fallback;
  const trimmed = raw.trim();
  if (LOGIN_PATHS.has(pathnameOnly(trimmed))) return fallback;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const u = new URL(trimmed);
      const o = new URL(siteOrigin);
      if (u.origin !== o.origin) return fallback;
      if (LOGIN_PATHS.has(u.pathname)) return fallback;
      const path = u.pathname + u.search;
      return path || fallback;
    } catch {
      return fallback;
    }
  }
  if (!trimmed.startsWith("/")) return fallback;
  return trimmed;
}

/** Si la cible est le hub vitrine par défaut, envoie selon le rôle applicatif. */
export function applyRoleToDefaultHub(
  destination: string,
  role: AppRole | undefined,
): string {
  if (destination !== "/mon-espace") return destination;
  if (role === "admin") return "/dashboard";
  if (role === "client") return "/mon-espace";
  if (role && partnerPathByRole[role]) return partnerPathByRole[role]!;
  return destination;
}
