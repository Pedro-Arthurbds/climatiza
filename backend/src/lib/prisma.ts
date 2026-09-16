import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});

// Uma única instância reutilizada em toda a aplicação (evita esgotar conexões
// em dev com hot-reload do ts-node-dev).
export const prisma = new PrismaClient({ adapter });
