/**
 * Crée ou met à jour un compte administrateur.
 *
 * Usage (depuis la racine) :
 *   npm run backend:seed:admin
 *
 * Variables (.env.local) :
 *   ADMIN_EMAIL    — défaut : rivaros.goudode@lasolution.org
 *   ADMIN_PASSWORD — défaut : adminlasolution@x
 *   ADMIN_NAME     — défaut : Rivaros GOUDODE
 */

const { PrismaClient } = require("@prisma/client");
const { hashPassword } = require("../src/auth/password");

const prisma = new PrismaClient();

async function main() {
  const adminId = process.env.ADMIN_ID || "admin-1";
  const email = (process.env.ADMIN_EMAIL || "rivaros.goudode@lasolution.org").trim().toLowerCase();
  const plainPassword = process.env.ADMIN_PASSWORD || "adminlasolution@x";
  const name = (process.env.ADMIN_NAME || "Rivaros GOUDODE").trim();

  if (plainPassword.length < 8) {
    throw new Error("ADMIN_PASSWORD doit contenir au moins 8 caractères.");
  }

  const passwordHash = hashPassword(plainPassword);
  const existing = await prisma.user.findUnique({ where: { id: adminId } });

  const user = await prisma.user.upsert({
    where: { id: adminId },
    update: { email, name, role: "admin", passwordHash },
    create: { id: adminId, email, name, role: "admin", passwordHash },
  });

  console.log(`Admin OK (${existing ? "mis à jour" : "créé"})`);
  console.log(`  email : ${user.email}`);
  console.log(`  id    : ${user.id}`);
  console.log(`  rôle  : ${user.role}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
