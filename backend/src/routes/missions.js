const { requireAuth, requireRoles } = require("../middleware/auth");

function setupMissionRoutes(app, getPrisma) {
  const packerOrAdmin = [requireAuth, requireRoles("admin", "solupacker")];

  /** Accepter une mission (solupacker ou admin). */
  app.post("/missions/:id/accept", ...packerOrAdmin, async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });
    const mission = await prisma.mission.findUnique({ where: { id: req.params.id } });
    if (!mission) return res.status(404).json({ error: "Mission introuvable." });
    if (req.auth.role !== "admin" && mission.packerUserId !== req.auth.sub) {
      return res.status(403).json({ error: "Accès refusé." });
    }
    if (!["PENDING", "PROPOSED"].includes(String(mission.status).toUpperCase())) {
      return res.status(409).json({ error: "Cette mission ne peut plus être acceptée." });
    }
    const updated = await prisma.mission.update({
      where: { id: mission.id },
      data: { status: "ACCEPTED" },
    });
    res.json(updated);
  });

  /** Refuser une mission. */
  app.post("/missions/:id/refuse", ...packerOrAdmin, async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });
    const mission = await prisma.mission.findUnique({ where: { id: req.params.id } });
    if (!mission) return res.status(404).json({ error: "Mission introuvable." });
    if (req.auth.role !== "admin" && mission.packerUserId !== req.auth.sub) {
      return res.status(403).json({ error: "Accès refusé." });
    }
    if (!["PENDING", "PROPOSED", "ACCEPTED"].includes(String(mission.status).toUpperCase())) {
      return res.status(409).json({ error: "Cette mission ne peut plus être refusée." });
    }
    const updated = await prisma.mission.update({
      where: { id: mission.id },
      data: { status: "REFUSED" },
    });
    res.json(updated);
  });

  app.get("/missions", ...packerOrAdmin, async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize || "20", 10)));
    const skip = (page - 1) * pageSize;

    const where =
      req.auth.role === "admin"
        ? {}
        : {
            packerUserId: req.auth.sub,
          };

    const [total, rows] = await Promise.all([
      prisma.mission.count({ where }),
      prisma.mission.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: { announcement: true },
      }),
    ]);

    res.json({ data: rows, pagination: { page, pageSize, total } });
  });

  app.get("/missions/:id", ...packerOrAdmin, async (req, res) => {
    const prisma = getPrisma();
    if (!prisma) return res.status(503).json({ error: "Base indisponible." });

    const mission = await prisma.mission.findUnique({
      where: { id: req.params.id },
      include: { announcement: true },
    });
    if (!mission) return res.status(404).json({ error: "Mission introuvable." });

    if (req.auth.role !== "admin" && mission.packerUserId !== req.auth.sub) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    res.json(mission);
  });
}

module.exports = { setupMissionRoutes };

