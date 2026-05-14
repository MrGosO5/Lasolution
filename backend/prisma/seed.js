const { PrismaClient } = require("@prisma/client");
const { hashPassword } = require("../src/auth/password");

const prisma = new PrismaClient();

/** Même logique que `backend/src/server.js` : le login accepte soit ces secrets, soit `User.passwordHash`. */
const demoPasswords = {
  admin: process.env.ADMIN_PASSWORD || "adminlasolution@x",
  client: process.env.CLIENT_PASSWORD || "client",
  partner: process.env.PARTNER_PASSWORD || "partner",
};

async function main() {
  const countries = [
    { code: "BJ", name: "Bénin", currency: "XOF" },
    { code: "TG", name: "Togo", currency: "XOF" },
    { code: "GA", name: "Gabon", currency: "XAF" },
    { code: "FR", name: "France", currency: "EUR" },
  ];

  for (const c of countries) {
    await prisma.country.upsert({
      where: { code: c.code },
      update: { name: c.name, currency: c.currency },
      create: c,
    });
  }

  await prisma.warehouseAddress.upsert({
    where: { id: "wh-fr-default" },
    update: {},
    create: {
      id: "wh-fr-default",
      label: "Entrepôt La Solution (France)",
      line1: "Adresse entrepôt à configurer",
      postal: "75001",
      city: "Paris",
      country: "FR",
      isDefault: true,
    },
  });

  const users = [
    {
      id: "admin-1",
      email: "adminlasolution@gmail.com",
      name: "Administrateur",
      role: "admin",
      plainPassword: demoPasswords.admin,
    },
    {
      id: "client-demo",
      email: "client@lasolution.demo",
      name: "Client démo",
      role: "client",
      plainPassword: demoPasswords.client,
    },
    {
      id: "relais-1",
      email: "relais@lasolution.demo",
      name: "Partenaire Relais",
      role: "relais",
      plainPassword: demoPasswords.partner,
    },
    {
      id: "packer-1",
      email: "packer@lasolution.demo",
      name: "Solupacker",
      role: "solupacker",
      plainPassword: demoPasswords.partner,
    },
    {
      id: "livreur-1",
      email: "livreur@lasolution.demo",
      name: "Solu livreur",
      role: "solu_livreur",
      plainPassword: demoPasswords.partner,
    },
    {
      id: "amb-1",
      email: "ambassadeur@lasolution.demo",
      name: "Ambassadeur",
      role: "ambassadeur",
      plainPassword: demoPasswords.partner,
    },
  ];

  for (const u of users) {
    const { plainPassword, ...rest } = u;
    const passwordHash = hashPassword(plainPassword);
    await prisma.user.upsert({
      where: { id: u.id },
      update: { email: rest.email, name: rest.name, role: rest.role, passwordHash },
      create: { ...rest, passwordHash },
    });
  }

  await prisma.paymentProvider.upsert({
    where: { code: "stripe" },
    update: {},
    create: { code: "stripe", name: "Stripe", active: true },
  });
  await prisma.paymentProvider.upsert({
    where: { code: "flutterwave" },
    update: {},
    create: { code: "flutterwave", name: "Flutterwave", active: true },
  });
  await prisma.paymentProvider.upsert({
    where: { code: "offline" },
    update: {},
    create: { code: "offline", name: "Paiement hors-ligne", active: true },
  });

  // Seed "ops" explicite pour tests UI Missions (aucune mission ne doit exister sans création).
  await prisma.announcement.upsert({
    where: { id: "ann-ops-1" },
    update: {
      title: "Mission: Livraison express",
      status: "PUBLISHED",
    },
    create: {
      id: "ann-ops-1",
      userId: "admin-1",
      title: "Mission: Livraison express",
      body: {
        route: "Paris → Cotonou",
        parcelWeightKg: 4.2,
        commissionEur: 12,
        deadline: "2026-04-02",
      },
      status: "PUBLISHED",
      startsAt: new Date(),
    },
  });

  await prisma.announcement.upsert({
    where: { id: "ann-ops-2" },
    update: {
      title: "Mission: Collecte point relais",
      status: "PUBLISHED",
    },
    create: {
      id: "ann-ops-2",
      userId: "admin-1",
      title: "Mission: Collecte point relais",
      body: {
        route: "Paris → Lomé",
        parcelWeightKg: 2.1,
        commissionEur: 8,
        deadline: "2026-04-05",
      },
      status: "PUBLISHED",
      startsAt: new Date(),
    },
  });

  await prisma.mission.upsert({
    where: { id: "mission-1" },
    update: { status: "IN_PROGRESS" },
    create: {
      id: "mission-1",
      announcementId: "ann-ops-1",
      packerUserId: "packer-1",
      status: "IN_PROGRESS",
    },
  });

  await prisma.mission.upsert({
    where: { id: "mission-2" },
    update: { status: "AWAITING_ACCEPTANCE" },
    create: {
      id: "mission-2",
      announcementId: "ann-ops-2",
      packerUserId: "packer-1",
      status: "AWAITING_ACCEPTANCE",
    },
  });

  console.log("Seed OK: countries, warehouse, users, payment providers, ops missions.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
