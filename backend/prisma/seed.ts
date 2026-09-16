import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { hashSenha } from "../src/utils/hash";

// Ajuste aqui se quiser outro e-mail/senha padrão, ou passe via variáveis
// de ambiente SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD.
const email = process.env.SEED_ADMIN_EMAIL ?? "admin@climatiza.com";
const senha = process.env.SEED_ADMIN_PASSWORD ?? "admin123";

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
  console.log(`  senha: ${senha}`);
  console.log("Troque a senha depois de logar pela primeira vez.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
