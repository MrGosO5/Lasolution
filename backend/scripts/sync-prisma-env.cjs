/**
 * Copie DATABASE_URL depuis ../.env.local vers backend/.env
 * (Prisma CLI / Studio — un seul fichier .env, pas prisma/.env en plus).
 */
const fs = require("fs");
const path = require("path");

const rootEnv = path.resolve(__dirname, "../../.env.local");
const backendEnv = path.resolve(__dirname, "../.env");
const legacyPrismaEnv = path.resolve(__dirname, "../prisma/.env");

function extractDatabaseUrl(content) {
  const m = content.match(/^DATABASE_URL\s*=\s*(.+)$/m);
  if (!m) return null;
  return `DATABASE_URL=${m[1].trim()}`;
}

if (!fs.existsSync(rootEnv)) {
  console.warn(
    "[sync-prisma-env] Fichier ../.env.local introuvable. Créez-le à la racine du dépôt (voir backend/.env.example).",
  );
  process.exit(0);
}

const line = extractDatabaseUrl(fs.readFileSync(rootEnv, "utf8"));
if (!line) {
  console.warn("[sync-prisma-env] DATABASE_URL absent dans ../.env.local");
  process.exit(0);
}

if (fs.existsSync(legacyPrismaEnv)) {
  fs.unlinkSync(legacyPrismaEnv);
  console.log("[sync-prisma-env] supprimé prisma/.env (conflit Prisma évité)");
}

const body = [
  "# Généré par backend/scripts/sync-prisma-env.cjs — ne pas committer",
  "# Source : Lasolution/.env.local",
  "",
  line,
  "",
].join("\n");

const prev = fs.existsSync(backendEnv) ? fs.readFileSync(backendEnv, "utf8") : "";
if (prev !== body) {
  fs.writeFileSync(backendEnv, body, "utf8");
  console.log("[sync-prisma-env] OK → .env");
}
