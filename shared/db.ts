import { PrismaClient } from "@prisma/client";
import path from "path";

const dbPath = path.resolve(__dirname, "data", "store.db");

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: { url: `file:${dbPath}` },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
