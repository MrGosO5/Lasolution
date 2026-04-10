import type { NextAuthOptions } from "next-auth";
import type { AppRole } from "@/types/app-role";
import CredentialsProvider from "next-auth/providers/credentials";

const AUTH_API_URL = process.env.AUTH_API_URL ?? "http://localhost:4000";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
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
            }),
          });

          if (!response.ok) return null;

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
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email ?? "";
        token.role = user.role;
        token.accessToken = user.accessToken ?? undefined;
        token.refreshToken = user.refreshToken ?? undefined;
      }
      if (trigger === "update" && session) {
        if (typeof session.accessToken === "string") {
          token.accessToken = session.accessToken;
        }
        if (typeof session.refreshToken === "string") {
          token.refreshToken = session.refreshToken;
        }
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
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  secret: process.env.NEXTAUTH_SECRET || "dev-secret-change-en-production",
};
