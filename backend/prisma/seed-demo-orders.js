/**
 * Jeu de données pour tester le flux admin (réception entrepôt, poids, expédition, statuts).
 *
 * Prérequis : avoir exécuté le seed principal (`npm run db:seed` dans backend avec .env.local).
 * Lance : `npm run db:seed:demo-orders` depuis `backend/`.
 *
 * Compte client utilisé : client@lasolution.demo (client-demo).
 * IDs de commandes fixes ci-dessous (recherchables dans le dashboard).
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const PROOF_IMAGE = "/icon/logo_solution.png";

const DEMO_ORDER_IDS = [
  "order-demo-pending-receipt",
  "order-demo-two-parcels",
  "order-demo-ready-to-ship",
  "order-demo-awaiting-payment",
  "order-demo-concierge",
];

async function main() {
  const fr = await prisma.country.findUnique({ where: { code: "FR" } });
  const client = await prisma.user.findUnique({ where: { id: "client-demo" } });
  if (!fr || !client) {
    throw new Error(
      "Pays FR ou utilisateur client-demo introuvable. Lancez d’abord le seed principal : npm run db:seed (avec dotenv-cli -e ../.env.local)."
    );
  }

  await prisma.order.deleteMany({ where: { id: { in: DEMO_ORDER_IDS } } });

  const line = (overrides = {}) => ({
    description: "Colis test — seed demo ops",
    quantity: 1,
    unitPrice: "49.9",
    currency: "EUR",
    ...overrides,
  });

  // 1) Commande payée, colis jamais reçu à l’entrepôt → tester POST /parcels/:id/warehouse-receipt
  await prisma.order.create({
    data: {
      id: "order-demo-pending-receipt",
      userId: client.id,
      type: "DIRECT_TO_WAREHOUSE",
      status: "PAID",
      deliveryMode: "AIR",
      proofImageUrl: PROOF_IMAGE,
      currency: "EUR",
      lines: { create: [line({ description: "Démo : en attente réception entrepôt", unitPrice: "35" })] },
      parcels: {
        create: [
          {
            id: "parcel-demo-1a",
            status: "CREATED",
          },
        ],
      },
    },
  });

  // 2) Deux colis : un déjà réceptionné, l’autre non → tester la 2e réception + sync multi-colis
  await prisma.order.create({
    data: {
      id: "order-demo-two-parcels",
      userId: client.id,
      type: "DIRECT_TO_WAREHOUSE",
      status: "PAID",
      deliveryMode: "SEA",
      proofImageUrl: PROOF_IMAGE,
      currency: "EUR",
      lines: { create: [line({ description: "Démo : 2 colis (1 reçu, 1 à recevoir)", unitPrice: "89.5" })] },
      parcels: {
        create: [
          {
            id: "parcel-demo-2a",
            status: "WAREHOUSE_RECEIVED",
            receivedAt: new Date("2026-05-10T14:00:00.000Z"),
            trackingEvents: {
              create: [
                {
                  status: "WAREHOUSE_RECEIVED",
                  message: "Réception confirmée à l’entrepôt (seed)",
                  meta: { source: "seed-demo-orders" },
                },
              ],
            },
          },
          {
            id: "parcel-demo-2b",
            status: "CREATED",
          },
        ],
      },
    },
  });

  // 3) Réceptionné + pesé, pas encore expédié → tester POST /parcels/:id/ship
  await prisma.order.create({
    data: {
      id: "order-demo-ready-to-ship",
      userId: client.id,
      type: "DIRECT_TO_WAREHOUSE",
      status: "WEIGHT_CAPTURED",
      deliveryMode: "AIR",
      proofImageUrl: PROOF_IMAGE,
      currency: "EUR",
      lines: { create: [line({ description: "Démo : prêt à expédier (poids OK)", unitPrice: "112" })] },
      parcels: {
        create: [
          {
            id: "parcel-demo-3a",
            status: "WEIGHT_CAPTURED",
            receivedAt: new Date("2026-05-11T09:30:00.000Z"),
            weightKg: "3.25",
            trackingEvents: {
              create: [
                {
                  status: "WAREHOUSE_RECEIVED",
                  message: "Réception seed",
                  meta: {},
                },
              ],
            },
          },
        ],
      },
    },
  });

  // 4) En attente de paiement → la réception entrepôt doit être refusée (409 côté API)
  await prisma.order.create({
    data: {
      id: "order-demo-awaiting-payment",
      userId: client.id,
      type: "DIRECT_TO_WAREHOUSE",
      status: "AWAITING_PAYMENT",
      deliveryMode: "AIR",
      proofImageUrl: PROOF_IMAGE,
      currency: "EUR",
      lines: { create: [line({ description: "Démo : paiement en attente", unitPrice: "25" })] },
      parcels: {
        create: [
          {
            id: "parcel-demo-4a",
            status: "CREATED",
          },
        ],
      },
    },
  });

  // 5) Conciergerie (demande d’achat) + commande payée + colis à réceptionner
  await prisma.order.create({
    data: {
      id: "order-demo-concierge",
      userId: client.id,
      type: "CONCIERGE_PURCHASE",
      status: "PAID",
      deliveryMode: "SEA",
      proofImageUrl: PROOF_IMAGE,
      currency: "EUR",
      lines: { create: [line({ description: "Démo : conciergerie — produit à acheter", unitPrice: "199" })] },
      procurement: {
        create: {
          status: "QUOTE_PENDING",
          notes: "Seed : en attente de devis ops.",
          lines: {
            create: [
              {
                label: "Article marketplace (URL à compléter)",
                productUrl: "https://example.com/produit-demo",
                maxBudget: "180",
                currency: "EUR",
              },
            ],
          },
        },
      },
      parcels: {
        create: [
          {
            id: "parcel-demo-5a",
            status: "CREATED",
          },
        ],
      },
    },
  });

  console.log("Seed demo commandes OK. IDs commandes :");
  for (const id of DEMO_ORDER_IDS) {
    console.log(`  - ${id}`);
  }
  console.log("Colis : parcel-demo-1a … parcel-demo-5a (voir Prisma Studio ou détail commande admin).");
  console.log("Client : client@lasolution.demo (mot de passe seed = CLIENT_PASSWORD ou « client »).");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
