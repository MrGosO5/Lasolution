import type { NextAuthOptions } from "next-auth";
import type { AppRole } from "@/types/app-role";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { getNextAuthSecret } from "@/lib/nextauth-secret";

const AUTH_API_URL =
  process.env.INTERNAL_AUTH_API_URL ?? process.env.AUTH_API_URL ?? "http://localhost:4000";
const SESSION_MAX_AGE_LONG = 30 * 24 * 60 * 60;
const SESSION_MAX_AGE_SHORT = 24 * 60 * 60;

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Mot de passe", type: "password" },
      totpCode: { label: "Code MFA", type: "text" },
      captchaToken: { label: "CAPTCHA", type: "text" },
      rememberMe: { label: "Rester connecté", type: "text" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      try {
        const response = await fetch(`${AUTH_API_URL}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
            totpCode: credentials.totpCode || undefined,
            captchaToken: credentials.captchaToken || undefined,
          }),
        });

        if (!response.ok) {
          let message = "Identifiants invalides.";
          try {
            const body = (await response.json()) as { error?: string; code?: string };
            if (body.error) message = body.error;
          } catch {
            /* ignore */
          }
          throw new Error(message);
        }

        const user = (await response.json()) as {
          id: string;
          email: string;
          role: AppRole;
          name: string;
          accessToken?: string;
          refreshToken?: string;
        };

        if (!user?.id || !user?.email || !user?.role || !user?.name) return null;
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          accessToken: user.accessToken ?? undefined,
          refreshToken: user.refreshToken ?? undefined,
          rememberMe: credentials.rememberMe === "true",
        };
      } catch (e) {
        if (e instanceof Error) throw e;
        throw new Error("Connexion impossible.");
      }
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!account || account.provider === "credentials") return true;
      const secret = process.env.OAUTH_INTERNAL_SECRET;
      if (!secret) return true;

      try {
        const r = await fetch(`${AUTH_API_URL}/auth/oauth/sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-oauth-internal-secret": secret,
          },
          body: JSON.stringify({
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            email: user.email,
            name: user.name,
          }),
        });
        if (!r.ok) return false;
        const data = (await r.json()) as {
          id: string;
          role: AppRole;
          name: string;
          accessToken?: string;
          refreshToken?: string;
        };
        user.id = data.id;
        user.role = data.role;
        user.name = data.name;
        user.accessToken = data.accessToken;
        user.refreshToken = data.refreshToken;
        return true;
      } catch {
        return false;
      }
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email ?? "";
        token.role = user.role;
        token.accessToken = user.accessToken ?? undefined;
        token.refreshToken = user.refreshToken ?? undefined;
        token.sessionMaxAge =
          user.rememberMe === true ? SESSION_MAX_AGE_LONG : SESSION_MAX_AGE_SHORT;
      }
      if (trigger === "update" && session) {
        if (typeof session.accessToken === "string") {
          token.accessToken = session.accessToken;
        }
        if (typeof session.refreshToken === "string") {
          token.refreshToken = session.refreshToken;
        }
      }

      const email = String(token.email || "").toLowerCase();
      if (
        token.role === "client" &&
        email === "client@lasolution.demo" &&
        token.id &&
        token.id !== "client-demo"
      ) {
        token.id = "client-demo";
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.role = token.role;
        session.user.accessToken = token.accessToken ?? undefined;
        session.user.refreshToken = undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/connexion",
  },
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_LONG,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE_LONG,
  },
  secret: getNextAuthSecret(),
};
