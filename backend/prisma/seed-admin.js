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
 *   ADMIN_ID       — défaut : admin-1
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
  const existingById = await prisma.user.findUnique({ where: { id: adminId } });
  const existingByEmail = await prisma.user.findUnique({ where: { email } });

  const user = await prisma.$transaction(async (tx) => {
    // L'email cible est déjà pris par un autre compte → on le libère avant upsert.
    if (existingByEmail && existingByEmail.id !== adminId) {
      const legacyEmail = `${existingByEmail.id}-legacy@internal.lasolution.invalid`;
      await tx.user.update({
        where: { id: existingByEmail.id },
        data: { email: legacyEmail },
      });
      console.log(`  note  : email libéré (compte ${existingByEmail.id} → ${legacyEmail})`);
    }

    return tx.user.upsert({
      where: { id: adminId },
      update: { email, name, role: "admin", passwordHash },
      create: { id: adminId, email, name, role: "admin", passwordHash },
    });
  });

  console.log(`Admin OK (${existingById ? "mis à jour" : "créé"})`);
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
