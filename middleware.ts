import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { AppRole } from "@/types/app-role";
import { getNextAuthSecret } from "@/lib/nextauth-secret";
import { partnerPathByRole, roleForPartnerSpace } from "@/lib/partner-routes";
import {
  SITE_PREVIEW_COOKIE,
  getSitePreviewSecret,
  isSitePreviewBypassPath,
  isSitePreviewEnabled,
  isValidPreviewCookie,
} from "@/lib/site-preview";

const protectedAdmin = ["/dashboard"];
const protectedClient = ["/espace-client"];
const protectedPartner = ["/partenaire"];
const protectedSite = [
  "/compte",
  "/mon-espace",
  "/mes-commandes",
  "/mes-avis",
  "/notifications",
  "/parametres",
  "/carte",
  "/prochain-voyage",
  "/checkout",
];
const protectedPacker = ["/missions"];

/** Aligné sur la requête réelle : si NEXTAUTH_URL est en https mais le dev en http, getToken doit lire le bon cookie. */
function secureCookieForRequest(req: NextRequest): boolean {
  const forwarded = req.headers.get("x-forwarded-proto");
  if (forwarded === "https") return true;
  if (forwarded === "http") return false;
  return req.nextUrl.protocol === "https:";
}

function redirectForRole(role: AppRole, base: URL): URL {
  if (role === "admin") return new URL("/dashboard", base);
  if (role === "client") return new URL("/mon-espace", base);
  const partnerPath = partnerPathByRole[role];
  if (partnerPath) return new URL(partnerPath, base);
  return new URL("/connexion", base);
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (isSitePreviewEnabled()) {
    const previewSecret = getSitePreviewSecret();
    if (previewSecret && !isSitePreviewBypassPath(path)) {
      const cookie = req.cookies.get(SITE_PREVIEW_COOKIE)?.value;
      if (!(await isValidPreviewCookie(cookie, previewSecret))) {
        const login = new URL("/acces-preview", req.url);
        login.searchParams.set(
          "callbackUrl",
          `${path}${req.nextUrl.search}`
        );
        return NextResponse.redirect(login);
      }
    }
  }

  const token = await getToken({
    req,
    secret: getNextAuthSecret(),
    secureCookie: secureCookieForRequest(req),
  });

  /** Session déjà active : éviter d’afficher le formulaire sous le header « connecté ». */
  if (token && (path === "/connexion" || path === "/login")) {
    const role = token.role as AppRole | undefined;
    const knownRoles: AppRole[] = [
      "admin",
      "client",
      "relais",
      "solupacker",
      "solu_livreur",
      "ambassadeur",
    ];
    if (role && knownRoles.includes(role)) {
      const dest = redirectForRole(role, req.nextUrl);
      if (dest.pathname !== "/connexion" && dest.pathname !== "/login") {
        return NextResponse.redirect(dest);
      }
    }
    // Cookie de session valide mais rôle absent / inconnu, ou redirectForRole a renvoyé login — sortir de la page login
    if (token.sub || token.email) {
      return NextResponse.redirect(new URL("/mon-espace", req.nextUrl));
    }
  }

  const isAdminRoute = protectedAdmin.some((p) => path.startsWith(p));
  const isClientRoute = protectedClient.some((p) => path.startsWith(p));
  const isPartnerRoute = protectedPartner.some((p) => path.startsWith(p));
  const isSiteRoute = protectedSite.some((p) => path.startsWith(p));
  const isPackerRoute = protectedPacker.some((p) => path.startsWith(p));

  if (isAdminRoute || isClientRoute || isPartnerRoute || isSiteRoute || isPackerRoute) {
    if (!token) {
      const loginUrl = new URL("/connexion", req.url);
      loginUrl.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(loginUrl);
    }

    const role = token.role as AppRole;

    if (isAdminRoute && role !== "admin") {
      return NextResponse.redirect(redirectForRole(role, req.nextUrl));
    }
    if (isClientRoute && role !== "client") {
      return NextResponse.redirect(redirectForRole(role, req.nextUrl));
    }
    if (isPartnerRoute) {
      const segment = path.split("/")[2];
      const required = roleForPartnerSpace(segment || "");
      if (!required || role !== required) {
        return NextResponse.redirect(redirectForRole(role, req.nextUrl));
      }
    }
    if (isSiteRoute) {
      // Pages privées "client" dans l'expérience e-commerce
      if (role !== "client" && role !== "admin") {
        return NextResponse.redirect(redirectForRole(role, req.nextUrl));
      }
      return NextResponse.next();
    }
    if (isPackerRoute) {
      // Missions: packer (ou admin)
      if (role !== "solupacker" && role !== "admin") {
        return NextResponse.redirect(redirectForRole(role, req.nextUrl));
      }
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /* Toutes les routes applicatives (hors assets) : portail SITE_PREVIEW_PASSWORD + garde NextAuth. */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
