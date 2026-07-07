import "next-auth";
import type { AppRole } from "./app-role";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    role: AppRole;
    name?: string | null;
    /** Jeton court API Lasolution (Bearer) — absent si login sans PostgreSQL côté backend */
    accessToken?: string | null;
    /** Stocké uniquement dans le JWT (getToken) — ne pas afficher côté client si possible */
    refreshToken?: string | null;
    rememberMe?: boolean;
  }

  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    role: AppRole;
    accessToken?: string;
    refreshToken?: string;
    sessionMaxAge?: number;
  }
}
