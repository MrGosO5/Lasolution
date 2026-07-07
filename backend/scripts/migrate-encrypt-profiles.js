/**
 * Migration one-shot : chiffre User.profile.phone existants.
 * Usage : DATA_ENCRYPTION_KEY dans .env.local, puis node scripts/migrate-encrypt-profiles.js
 */
const path = require("path");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");
const { encryptJsonFields, decryptJsonFields } = require("../src/crypto/fieldEncryption");

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config();

const KEYS = ["phone"];
const prisma = new PrismaClient();

async function main() {
  if (!process.env.DATA_ENCRYPTION_KEY) {
    throw new Error("DATA_ENCRYPTION_KEY requis.");
  }

  const users = await prisma.user.findMany({
    where: { profile: { not: null } },
    select: { id: true, profile: true },
  });

  let updated = 0;
  for (const u of users) {
    if (!u.profile || typeof u.profile !== "object") continue;
    const plain = decryptJsonFields(u.profile, KEYS);
    const enc = encryptJsonFields(plain, KEYS);
    if (JSON.stringify(enc) === JSON.stringify(u.profile)) continue;
    await prisma.user.update({ where: { id: u.id }, data: { profile: enc } });
    updated += 1;
  }

  console.log(`Profils migrés : ${updated}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
