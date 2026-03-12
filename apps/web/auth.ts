import { prisma } from "@valyria/database";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyOtpCode } from "@/lib/otp";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt"
  },
  providers: [
    Credentials({
      id: "wallet",
      name: "Wallet",
      credentials: {
        walletAddress: { label: "Wallet Address", type: "text" },
        userId: { label: "User ID", type: "text" }
      },
      async authorize(credentials) {
        const walletAddress = credentials?.walletAddress;
        const userId = credentials?.userId;

        if (typeof walletAddress !== "string" || typeof userId !== "string") {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { id: userId }
        });

        if (!user || user.walletAddress !== walletAddress) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.walletAddress ?? null
        };
      }
    }),
    Credentials({
      id: "email-otp",
      name: "Email OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" }
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const code = credentials?.code;

        if (typeof email !== "string" || typeof code !== "string") {
          return null;
        }

        const isValid = await verifyOtpCode(email, code);

        if (!isValid) {
          return null;
        }

        const user = await prisma.user.upsert({
          where: { email },
          update: {
            emailVerified: new Date(),
            state: "email_verified",
            updatedAt: new Date()
          },
          create: {
            email,
            state: "email_verified",
            roles: [],
            emailVerified: new Date()
          }
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? null
        };
      }
    })
  ],
  pages: {
    signIn: "/login"
  },
  callbacks: {
    async jwt({ token, user }) {
      // So consulta o banco no primeiro sign-in (quando user esta presente)
      // Nas navegacoes subsequentes, reutiliza o token existente
      if (user) {
        const userId = typeof user.id === "string" ? user.id : undefined;

        if (userId) {
          const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              name: true,
              email: true,
              state: true,
              walletAddress: true,
              roles: true
            }
          });

          if (dbUser) {
            token.sub = dbUser.id;
            token.name = dbUser.name ?? token.name ?? null;
            token.email = dbUser.email;
            token.state = dbUser.state;
            token.roles = dbUser.roles;

            if (dbUser.walletAddress) {
              token.walletAddress = dbUser.walletAddress;
            } else {
              delete token.walletAddress;
            }
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.sub === "string") {
        session.user.id = token.sub;

        if (typeof token.name === "string") {
          session.user.name = token.name;
        }

        if (typeof token.email === "string") {
          session.user.email = token.email;
        }

        if (typeof token.state === "string") {
          session.user.state = token.state;
        }

        if (typeof token.walletAddress === "string") {
          session.user.walletAddress = token.walletAddress;
        }

        if (Array.isArray(token.roles)) {
          session.user.roles = token.roles as string[];
        }
      }

      return session;
    }
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? "valyria-dev-secret"
});
