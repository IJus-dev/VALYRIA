import { PrismaClient } from "../generated/client/index.js";

declare global {
  // eslint-disable-next-line no-var
  var __valyriaPrisma__: PrismaClient | undefined;
}

export const prisma =
  globalThis.__valyriaPrisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__valyriaPrisma__ = prisma;
}
