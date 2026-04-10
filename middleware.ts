import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { AppRole } from "@/types/app-role";
import { partnerPathByRole, roleForPartnerSpace } from "@/lib/partner-routes";

const protectedAdmin = ["/dashboard"];
const protectedClient = ["/espace-client"];
const protectedPartner = ["/partenaire"];
const protectedSite = [
  "/compte",
  "/mon-espace",
  "/mes-commandes",
  "/notifications",
  "/parametres",
  "/carte",
  "/prochain-voyage",
  "/checkout",
];
const protectedPacker = ["/missions"];

function redirectForRole(role: AppRole, base: URL): URL {
  if (role === "admin") return new URL("/dashboard", base);
  if (role === "client") return new URL("/espace-client", base);
  const partnerPath = partnerPathByRole[role];
  if (partnerPath) return new URL(partnerPath, base);
  return new URL("/connexion", base);
}

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const path = req.nextUrl.pathname;

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
    "/dashboard",
    "/dashboard/:path*",
    "/espace-client",
    "/espace-client/:path*",
    "/partenaire",
    "/partenaire/:path*",
    "/compte",
    "/compte/:path*",
    "/mon-espace",
    "/mon-espace/:path*",
    "/mes-commandes",
    "/mes-commandes/:path*",
    "/missions",
    "/missions/:path*",
    "/notifications",
    "/notifications/:path*",
    "/parametres",
    "/parametres/:path*",
    "/carte",
    "/carte/:path*",
    "/prochain-voyage",
    "/prochain-voyage/:path*",
    "/checkout",
    "/checkout/:path*",
  ],
};
