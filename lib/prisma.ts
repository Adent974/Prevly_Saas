import * as PrismaPkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma package export shapes changed across versions; resolve constructor defensively
const PrismaClientCtor: any = (PrismaPkg as any).PrismaClient ?? (PrismaPkg as any).default ?? PrismaPkg;

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // Return a client without adapter during build time (no DB needed)
    return new PrismaClientCtor({ log: ["error"] } as any);
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClientCtor({ adapter, log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"] } as any);
}

const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined;
};

export const prisma: any = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
