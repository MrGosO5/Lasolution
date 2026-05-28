const DEMO_CLIENT_EMAIL = "client@lasolution.demo";
const DEMO_CLIENT_ID = "client-demo";

/**
 * Ancien login « mot de passe env » utilisait sub `client-{email}` au lieu de `client-demo`.
 * Les commandes seed sont sur client-demo — on réaligne sub pour les requêtes API.
 */
const LEGACY_DEMO_CLIENT_SUB = "client-client@lasolution.demo";

function isLegacyDemoClientSub(sub) {
  const s = String(sub || "");
  return s === LEGACY_DEMO_CLIENT_SUB || s === `client-${DEMO_CLIENT_EMAIL}`;
}

function normalizeAuthPayload(payload) {
  if (!payload || payload.role !== "client") return payload;

  const email = String(payload.email || "").trim().toLowerCase();
  const legacySub = isLegacyDemoClientSub(payload.sub);
  if (email !== DEMO_CLIENT_EMAIL && !legacySub) return payload;
  if (payload.sub === DEMO_CLIENT_ID) return payload;

  return {
    ...payload,
    sub: DEMO_CLIENT_ID,
    email: email || DEMO_CLIENT_EMAIL,
    _legacySub: payload.sub,
  };
}

function toClientUser(row, fallbackName) {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    name: row.name || fallbackName || "Client démo",
  };
}

/**
 * Fusionne l’ancien compte `client-client@lasolution.demo` vers `client-demo`
 * (conflit unique sur email lors du upsert login).
 */
async function reconcileDemoClientAccount(prisma, user) {
  if (!user || user.role !== "client") return user;
  const em = String(user.email || "").trim().toLowerCase();
  if (em !== DEMO_CLIENT_EMAIL && !isLegacyDemoClientSub(user.id)) return user;

  if (!prisma) {
    return {
      ...user,
      id: DEMO_CLIENT_ID,
      email: em || DEMO_CLIENT_EMAIL,
      name: user.name || "Client démo",
    };
  }

  const byEmail = await prisma.user.findUnique({ where: { email: em } });
  const targetRow = await prisma.user.findUnique({ where: { id: DEMO_CLIENT_ID } });

  if (byEmail?.id === DEMO_CLIENT_ID) {
    return toClientUser(byEmail, user.name);
  }

  if (byEmail && isLegacyDemoClientSub(byEmail.id)) {
    const legacyId = byEmail.id;
    await prisma.$transaction(async (tx) => {
      if (!targetRow) {
        await tx.user.create({
          data: {
            id: DEMO_CLIENT_ID,
            email: `_migrate_${DEMO_CLIENT_ID}@local`,
            name: "Client démo",
            role: "client",
            passwordHash: byEmail.passwordHash,
          },
        });
      }

      const move = (model) =>
        tx[model].updateMany({ where: { userId: legacyId }, data: { userId: DEMO_CLIENT_ID } });

      await move("order");
      await move("orderTestimonial");
      await move("address");
      await move("refreshToken");
      await move("kycSubmission");
      await move("userApplication");
      await move("passwordResetToken");
      await tx.securityEvent.updateMany({
        where: { userId: legacyId },
        data: { userId: DEMO_CLIENT_ID },
      });

      const legacyWallet = await tx.wallet.findUnique({ where: { userId: legacyId } });
      if (legacyWallet) {
        await tx.wallet.delete({ where: { userId: legacyId } }).catch(() => {});
      }

      await tx.user.delete({ where: { id: legacyId } });

      await tx.user.update({
        where: { id: DEMO_CLIENT_ID },
        data: {
          email: em,
          name: byEmail.name || "Client démo",
          role: "client",
          ...(byEmail.passwordHash ? { passwordHash: byEmail.passwordHash } : {}),
        },
      });
    });

    const merged = await prisma.user.findUnique({ where: { id: DEMO_CLIENT_ID } });
    if (merged) return toClientUser(merged, user.name);
  }

  if (targetRow) {
    return toClientUser(targetRow, user.name);
  }

  return {
    ...user,
    id: DEMO_CLIENT_ID,
    email: em || DEMO_CLIENT_EMAIL,
    name: user.name || "Client démo",
  };
}

/** @deprecated Utiliser reconcileDemoClientAccount */
async function coerceDemoClientUser(prisma, user) {
  return reconcileDemoClientAccount(prisma, user);
}

module.exports = {
  normalizeAuthPayload,
  reconcileDemoClientAccount,
  coerceDemoClientUser,
  isLegacyDemoClientSub,
  DEMO_CLIENT_EMAIL,
  DEMO_CLIENT_ID,
  LEGACY_DEMO_CLIENT_SUB,
};
