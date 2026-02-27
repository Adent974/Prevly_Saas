import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" }, // "professional" | "admin"
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const role = credentials.role ?? "professional";

        if (role === "admin") {
          const admin = await prisma.admin.findUnique({
            where: { email: credentials.email },
          });
          if (!admin) return null;
          const valid = await bcrypt.compare(credentials.password, admin.passwordHash);
          if (!valid) return null;
          return { id: admin.id, email: admin.email, name: admin.name, role: "admin" };
        }

        const pro = await prisma.professional.findUnique({
          where: { email: credentials.email },
        });
        if (!pro || !pro.isActive) return null;
        const valid = await bcrypt.compare(credentials.password, pro.passwordHash);
        if (!valid) return null;
        return {
          id: pro.id,
          email: pro.email,
          name: pro.name,
          role: "professional",
          specialty: pro.specialty ?? undefined,
          organizationName: pro.organizationName ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.specialty = (user as any).specialty;
        token.organizationName = (user as any).organizationName;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.specialty = token.specialty as string;
        session.user.organizationName = token.organizationName as string;
      }
      return session;
    },
  },
};
