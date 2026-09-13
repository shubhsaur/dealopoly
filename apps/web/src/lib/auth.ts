import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { getDb, users, accounts, sessions, verificationTokens, eq } from "@dealopoly/db";

import { hashPassword, verifyPassword } from "./password";

// Resolve Google credentials from all common naming conventions
const googleClientId = (
  process.env.AUTH_GOOGLE_ID ||
  process.env.GOOGLE_CLIENT_ID ||
  process.env.GOOGLE_ID ||
  process.env.AUTH_GOOGLE_CLIENT_ID
)?.trim();

const googleClientSecret = (
  process.env.AUTH_GOOGLE_SECRET ||
  process.env.GOOGLE_CLIENT_SECRET ||
  process.env.GOOGLE_SECRET ||
  process.env.AUTH_GOOGLE_CLIENT_SECRET
)?.trim();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(getDb(), {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: "jwt",
  },
  // Avoid UntrustedHost error in local development and production proxies
  trustHost: true,
  // Ensure secret is present even if not set in .env during dev
  secret:
    (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET)?.trim() ||
    "dealopoly-secret-key-for-jwt-session-encryption-2026",
  providers: [
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      id: "credentials",
      name: "Player Account",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        username: { label: "Username / Display Name", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null;
        }

        const email = String(credentials.email).toLowerCase().trim();
        const password = credentials.password ? String(credentials.password) : null;
        const username = credentials.username ? String(credentials.username).trim() : null;
        const database = getDb();

        try {
          // Find existing user by email
          const existingUsers = await database
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          const existingUser = existingUsers[0];

          if (existingUser) {
            // If user has a password set, verify it
            if (existingUser.password) {
              if (!password || !verifyPassword(password, existingUser.password)) {
                return null;
              }
            }
            return {
              id: String(existingUser.id),
              name: existingUser.name,
              email: existingUser.email,
              image: existingUser.image,
            };
          }

          // If user doesn't exist yet and username is provided (registration / quick login)
          const displayName = username || email.split("@")[0] || "Player";
          const passwordHash = password ? hashPassword(password) : null;

          const inserted = await database
            .insert(users)
            .values({
              name: displayName,
              email,
              password: passwordHash,
              customTag: `${displayName}#${Math.floor(1000 + Math.random() * 9000)}`,
              gamesPlayed: 0,
              gamesWon: 0,
            })
            .returning();

          const newUser = inserted[0];
          if (!newUser) return null;

          return {
            id: String(newUser.id),
            name: newUser.name,
            email: newUser.email,
            image: newUser.image,
          };
        } catch (err: unknown) {
          console.error("[Auth Error]", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, profile }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = (user.image ?? (profile as Record<string, unknown> | undefined)?.["picture"] ?? (profile as Record<string, unknown> | undefined)?.["avatar_url"]) as string | undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.id) session.user.id = String(token.id);
        if (token.name) session.user.name = token.name;
        if (token.picture) session.user.image = token.picture as string;
        if (token.email) session.user.email = token.email as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
