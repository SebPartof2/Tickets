import NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      givenName: string;
      familyName: string;
      accessLevel: "user" | "admin";
      sAuthId: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    givenName: string;
    familyName: string;
    accessLevel: "user" | "admin";
  }
}

interface ExtendedJWT extends JWT {
  id?: string;
  accessLevel?: "user" | "admin";
  sAuthId?: string;
  givenName?: string;
  familyName?: string;
}

interface SAuthProfile {
  sub: string;
  email: string;
  given_name: string;
  family_name: string;
  access_level?: string;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    {
      id: "s-auth",
      name: "S-Auth",
      type: "oauth",
      authorization: {
        url: "https://auth.sebbyk.net/authorize",
        params: {
          scope: "openid profile email",
          response_type: "code",
        },
      },
      token: "https://auth.sebbyk.net/token",
      userinfo: "https://auth.sebbyk.net/userinfo",
      clientId: process.env.S_AUTH_CLIENT_ID!,
      clientSecret: process.env.S_AUTH_CLIENT_SECRET!,
      checks: ["state"],
      profile(profile: SAuthProfile) {
        return {
          id: profile.sub,
          email: profile.email,
          name: `${profile.given_name} ${profile.family_name}`,
          givenName: profile.given_name,
          familyName: profile.family_name,
          accessLevel: (profile.access_level as "user" | "admin") || "user",
        };
      },
    },
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "s-auth" && profile) {
        const sAuthProfile = profile as SAuthProfile;
        try {
          const existingUser = await db.query.users.findFirst({
            where: eq(users.sAuthId, sAuthProfile.sub),
          });

          if (!existingUser) {
            await db.insert(users).values({
              sAuthId: sAuthProfile.sub,
              email: sAuthProfile.email,
              givenName: sAuthProfile.given_name,
              familyName: sAuthProfile.family_name,
              accessLevel: (sAuthProfile.access_level as "user" | "admin") || "user",
            });
          } else {
            await db
              .update(users)
              .set({
                email: sAuthProfile.email,
                givenName: sAuthProfile.given_name,
                familyName: sAuthProfile.family_name,
                accessLevel: (sAuthProfile.access_level as "user" | "admin") || "user",
                updatedAt: new Date(),
              })
              .where(eq(users.sAuthId, sAuthProfile.sub));
          }
        } catch (error) {
          console.error("Error syncing user:", error);
        }
      }
      return true;
    },
    async jwt({ token, account, profile }): Promise<ExtendedJWT> {
      const extToken = token as ExtendedJWT;

      if (account && profile) {
        const sAuthProfile = profile as SAuthProfile;
        extToken.accessLevel = (sAuthProfile.access_level as "user" | "admin") || "user";
        extToken.sAuthId = sAuthProfile.sub;
        extToken.givenName = sAuthProfile.given_name;
        extToken.familyName = sAuthProfile.family_name;
      }

      if (extToken.sAuthId && !extToken.id) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.sAuthId, extToken.sAuthId),
        });
        if (dbUser) {
          extToken.id = dbUser.id;
        }
      }

      return extToken;
    },
    async session({ session, token }): Promise<Session> {
      const extToken = token as ExtendedJWT;

      if (session.user && extToken) {
        session.user.id = extToken.id as string;
        session.user.accessLevel = extToken.accessLevel as "user" | "admin";
        session.user.sAuthId = extToken.sAuthId as string;
        session.user.givenName = extToken.givenName as string;
        session.user.familyName = extToken.familyName as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
});
