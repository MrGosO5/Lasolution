"use strict";

/**
 * On Windows, Prisma's rename(query_engine.tmp -> .dll) often fails with EPERM when another
 * Node process still has the engine loaded (e.g. backend `src/server.js`), or when OneDrive
 * briefly locks files. We stop only this repo's backend/worker nodes, then retry generate.
 */
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const backendRoot = path.join(__dirname, "..");
const prismaCli = path.join(backendRoot, "node_modules", "prisma", "build", "index.js");
const prismaClientDir = path.join(backendRoot, "node_modules", ".prisma", "client");

const isWin = process.platform === "win32";
const maxAttempts = isWin ? 6 : 1;
const delayMs = isWin ? 2000 : 0;

function sleepSync(ms) {
  if (ms <= 0) return;
  try {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
  } catch {
    // ignore
  }
}

function removeStalePrismaEngineTemps() {
  try {
    if (!fs.existsSync(prismaClientDir)) return;
    for (const name of fs.readdirSync(prismaClientDir)) {
      if (!name.includes(".tmp")) continue;
      try {
        fs.unlinkSync(path.join(prismaClientDir, name));
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
}

function stopLasolutionBackendNodes() {
  if (!isWin) return;
  const ps = [
    "$ErrorActionPreference = 'SilentlyContinue'",
    "$procs = Get-CimInstance Win32_Process -Filter \"Name='node.exe'\"",
    "foreach ($p in $procs) {",
    "  $cl = $p.CommandLine",
    "  if ($null -eq $cl) { continue }",
    "  if ($cl -notmatch '(?i)node(\\.exe)?') { continue }",
    "  if ($cl -match 'npm-cli|tsserver|typingsInstaller|Creative Cloud|Adobe|extensions\\\\node_modules') { continue }",
    "  if ($cl -notmatch '(?i)(server|worker)\\.js') { continue }",
    "  if ($cl -notmatch '(?i)src[\\\\/]+(server|worker)\\.js') { continue }",
    "  Stop-Process -Id $p.ProcessId -Force",
    "}",
  ].join("; ");

  console.error(
    "[prisma-generate] Windows: stopping Node processes running this backend’s src/server.js or src/worker.js so Prisma can replace the query engine DLL."
  );
  spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", ps], {
    stdio: "pipe",
  });
}

if (isWin) {
  stopLasolutionBackendNodes();
  sleepSync(1500);
}
removeStalePrismaEngineTemps();

for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  const r = spawnSync(process.execPath, [prismaCli, "generate"], {
    cwd: backendRoot,
    stdio: "inherit",
    env: process.env,
  });
  if (r.status === 0) process.exit(0);
  if (attempt < maxAttempts) {
    console.error(
      `[prisma-generate] attempt ${attempt}/${maxAttempts} failed (exit ${r.status ?? r.signal}); retrying in ${delayMs}ms…`
    );
    removeStalePrismaEngineTemps();
    sleepSync(delayMs);
  }
}

process.exit(1);
