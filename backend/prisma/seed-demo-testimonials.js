/**
 * Témoignages de démo (affichage site — statut APPROVED).
 *
 * Prérequis : seed principal (`npm run db:seed`).
 * Lance : `npm run db:seed:demo-testimonials` depuis `backend/`.
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const PROOF_IMAGE = "/icon/logo_solution.png";
const ADMIN_ID = "admin-1";
const CLIENT_ID = "client-demo";

const DEMO_ORDER_IDS = [
  "order-demo-testimonial-andre",
  "order-demo-testimonial-aicha",
  "order-demo-testimonial-hamid",
  "order-demo-testimonial-pending",
];

const DEMO_TESTIMONIAL_IDS = [
  "testimonial-demo-andre",
  "testimonial-demo-aicha",
  "testimonial-demo-hamid",
  "testimonial-demo-pending",
];

const APPROVED = [
  {
    testimonialId: "testimonial-demo-andre",
    orderId: "order-demo-testimonial-andre",
    clientName: "André",
    city: "Cotonou",
    country: "Bénin",
    message:
      "J'ai commandé un sac en Europe, et je l'ai reçu en 10 jours à Cotonou. Le suivi était clair, et le service client super réactif.",
    rating: 5,
  },
  {
    testimonialId: "testimonial-demo-aicha",
    orderId: "order-demo-testimonial-aicha",
    clientName: "Aïcha",
    city: "Lomé",
    country: "Togo",
    message:
      "Le service d'achat assisté est juste génial. Je choisis ce que je veux, ils commandent et je reçois tout sans stress.",
    rating: 5,
  },
  {
    testimonialId: "testimonial-demo-hamid",
    orderId: "order-demo-testimonial-hamid",
    clientName: "Hamid",
    city: "Paris",
    country: "France",
    message:
      "En tant que Solupacker, je gagne de l'argent en rentrant chez moi. L'application est bien faite, et les paiements sont rapides.",
    rating: 5,
  },
];

const PENDING = {
  testimonialId: "testimonial-demo-pending",
  orderId: "order-demo-testimonial-pending",
  clientName: "Chantal",
  city: "Abidjan",
  country: "Côte d'Ivoire",
  message:
    "J'ai reçu ma commande sans souci, livrée par un partenaire relais près de chez moi. Très pratique et sécurisé !",
  rating: 5,
};

async function upsertDeliveredOrder(orderId, description) {
  await prisma.order.upsert({
    where: { id: orderId },
    update: {
      status: "DELIVERED",
      userId: CLIENT_ID,
      proofImageUrl: PROOF_IMAGE,
    },
    create: {
      id: orderId,
      userId: CLIENT_ID,
      type: "DIRECT_TO_WAREHOUSE",
      status: "DELIVERED",
      deliveryMode: "AIR",
      proofImageUrl: PROOF_IMAGE,
      currency: "EUR",
      lines: {
        create: [
          {
            description,
            quantity: 1,
            unitPrice: "29.9",
            currency: "EUR",
          },
        ],
      },
      parcels: {
        create: [
          {
            id: `parcel-${orderId}`,
            status: "DELIVERED",
            receivedAt: new Date("2026-01-15T10:00:00Z"),
            shippedAt: new Date("2026-01-20T14:00:00Z"),
          },
        ],
      },
    },
  });
}

async function main() {
  const client = await prisma.user.findUnique({ where: { id: CLIENT_ID } });
  const admin = await prisma.user.findUnique({ where: { id: ADMIN_ID } });
  if (!client || !admin) {
    throw new Error(
      "Utilisateurs client-demo / admin-1 introuvables. Lancez d'abord : npm run db:seed",
    );
  }

  await prisma.orderTestimonial.deleteMany({
    where: { id: { in: DEMO_TESTIMONIAL_IDS } },
  });
  await prisma.order.deleteMany({ where: { id: { in: DEMO_ORDER_IDS } } });

  const reviewedAt = new Date("2026-02-01T12:00:00Z");

  for (const row of APPROVED) {
    await upsertDeliveredOrder(row.orderId, `Démo avis — ${row.clientName}`);
    await prisma.orderTestimonial.create({
      data: {
        id: row.testimonialId,
        orderId: row.orderId,
        userId: CLIENT_ID,
        clientName: row.clientName,
        city: row.city,
        country: row.country,
        message: row.message,
        rating: row.rating,
        status: "APPROVED",
        isDemo: true,
        reviewedAt,
        reviewedBy: ADMIN_ID,
      },
    });
  }

  await upsertDeliveredOrder(PENDING.orderId, `Démo avis — ${PENDING.clientName} (en attente)`);
  await prisma.orderTestimonial.create({
    data: {
      id: PENDING.testimonialId,
      orderId: PENDING.orderId,
      userId: CLIENT_ID,
      clientName: PENDING.clientName,
      city: PENDING.city,
      country: PENDING.country,
      message: PENDING.message,
      rating: PENDING.rating,
      status: "PENDING",
      isDemo: true,
    },
  });

  console.log(
    `Seed OK: ${APPROVED.length} avis APPROVED (site public), 1 avis PENDING (modération admin).`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
