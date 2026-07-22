"use strict";

/**
 * Libère le port d’écoute du backend avant `npm run dev` / `start`
 * pour éviter EADDRINUSE quand un ancien node src/server.js tourne encore.
 */
const { spawnSync } = require("node:child_process");

const port = Number(process.env.PORT || process.argv[2] || 4000);
if (!Number.isFinite(port) || port <= 0) {
  console.error(`[free-port] port invalide: ${port}`);
  process.exit(1);
}

function sleepSync(ms) {
  try {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
  } catch {
    // ignore
  }
}

function freePortWindows(p) {
  const ps = [
    `$ErrorActionPreference = 'SilentlyContinue'`,
    `$conns = Get-NetTCPConnection -LocalPort ${p} -State Listen`,
    `foreach ($c in $conns) {`,
    `  $procId = $c.OwningProcess`,
    `  if ($null -eq $procId -or $procId -le 0) { continue }`,
    `  $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue`,
    `  if ($null -eq $proc) { continue }`,
    `  Write-Output ("[free-port] killing PID " + $procId + " (" + $proc.ProcessName + ") on :${p}")`,
    `  Stop-Process -Id $procId -Force`,
    `}`,
  ].join("; ");

  const r = spawnSync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", ps],
    { encoding: "utf8" },
  );
  const out = `${r.stdout || ""}${r.stderr || ""}`.trim();
  if (out) console.log(out);
}

function freePortUnix(p) {
  const r = spawnSync("sh", ["-c", `lsof -ti tcp:${p} -sTCP:LISTEN 2>/dev/null || true`], {
    encoding: "utf8",
  });
  const pids = String(r.stdout || "")
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const pid of pids) {
    console.log(`[free-port] killing PID ${pid} on :${p}`);
    spawnSync("kill", ["-9", pid], { stdio: "ignore" });
  }
}

if (process.platform === "win32") {
  freePortWindows(port);
} else {
  freePortUnix(port);
}

sleepSync(400);
process.exit(0);
