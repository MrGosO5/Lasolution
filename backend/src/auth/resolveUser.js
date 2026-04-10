function resolveUserFromCredentials(email, password, config) {
  const { adminEmail, adminPassword, clientPassword, partnerPassword, demoPartners } = config;
  if (!email || !password) return null;

  const em = String(email).trim();
  const adminEm = String(adminEmail || "").trim();

  if (em.length > 0 && em.toLowerCase() === adminEm.toLowerCase() && password === adminPassword) {
    return { id: "admin-1", email: em, role: "admin", name: "Administrateur" };
  }

  if (password === clientPassword) {
    return { id: `client-${em}`, email: em, role: "client", name: em };
  }

  if (partnerPassword && password === partnerPassword) {
    const hit = demoPartners.find((p) => p.email.toLowerCase() === em.toLowerCase());
    if (hit) {
      return { id: hit.id, email: em, role: hit.role, name: hit.name };
    }
  }

  return null;
}

async function ensureUserInDb(prisma, user) {
  if (!prisma) return;
  await prisma.user.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    update: {
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
}

module.exports = { resolveUserFromCredentials, ensureUserInDb };
