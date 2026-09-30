import "dotenv/config";
import { z } from "zod";
import { prisma } from "../src/lib/prisma";
import { hashSenha } from "../src/utils/hash";

const credenciais = z.object({
  email: z.string().email(),
  senha: z.string().min(16),
}).safeParse({
  email: process.env.SEED_ADMIN_EMAIL,
  senha: process.env.SEED_ADMIN_PASSWORD,
});

if (!credenciais.success) {
  throw new Error("Defina SEED_ADMIN_EMAIL válido e SEED_ADMIN_PASSWORD com pelo menos 16 caracteres.");
}

const { email, senha } = credenciais.data;

async function main() {
  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: "Administrador",
      email,
      password: await hashSenha(senha),
      role: "ADMIN",
    },
  });

  console.log("Usuário admin pronto:");
  console.log(`  email: ${admin.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
