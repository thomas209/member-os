// ENSAYO GENERAL DEL DEPLOY — produccion queda intacta.
//
//   npm run db:ensayo
//
// Que hace (y que NO hace):
//   1. Backup JSON de produccion (transaccion READ ONLY: Postgres rechaza escrituras).
//   2. Copia exacta de produccion con pg_dump (pg_dump solo lee).
//   3. Restaura esa copia en una base NUEVA de tu Mac: "member_os_ensayo".
//      (Tu base local de desarrollo, member_os_dev, NO se toca.)
//   4. Verifica que la copia tenga exactamente las mismas filas que produccion
//      -> prueba que el backup se puede recuperar.
//   5. Aplica las migraciones pendientes a la COPIA con `prisma migrate deploy`,
//      el mismo comando que se usaria en produccion.
//   6. Compara tabla por tabla: ninguna tabla existente puede perder filas.
//   7. Deja un informe en backups/<fecha>-ensayo/INFORME.md
//
// Nunca escribe en produccion. Solo escribe en localhost/member_os_ensayo.
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { getProdUrl, getLocalUrl, isLocalUrl, describeUrl, connect, fail } from "./lib/db-env.mjs";
import { backup } from "./db-backup.mjs";

const ENSAYO_DB = "member_os_ensayo";
const ok = (m) => console.log("\x1b[32m✓\x1b[0m " + m);
const step = (n, m) => console.log("\n\x1b[1m" + n + ". " + m + "\x1b[0m");

const prodUrl = getProdUrl();
const localUrl = getLocalUrl();
if (!isLocalUrl(localUrl)) fail("DATABASE_URL de .env no es local. No sigo.");
if (isLocalUrl(prodUrl)) fail("PROD_DATABASE_URL apunta a localhost: revisá .env.prod-db.");

const ensayoUrl = (() => { const u = new URL(localUrl); u.pathname = "/" + ENSAYO_DB; return u.toString(); })();
const adminUrl = (() => { const u = new URL(localUrl); u.pathname = "/postgres"; return u.toString(); })();
if (!isLocalUrl(ensayoUrl) || !ensayoUrl.includes(ENSAYO_DB)) fail("No pude armar la URL de la base de ensayo.");

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const dir = path.join("backups", stamp + "-ensayo");
fs.mkdirSync(dir, { recursive: true });
const informe = [`# Ensayo de deploy — ${new Date().toLocaleString("es-AR", { hour12: false })}`, "", `Producción: ${describeUrl(prodUrl)} (solo lectura)`, `Copia: ${describeUrl(ensayoUrl)}`, ""];

// Herramientas de Postgres (pg_dump/pg_restore) de la misma version que el servidor.
async function serverMajor(url) {
  const c = await connect(url);
  const v = (await c.query("SHOW server_version_num")).rows[0].server_version_num;
  await c.end();
  return Math.floor(Number(v) / 10000);
}
function findPgBin(tool, major) {
  const candidates = [
    `/Applications/Postgres.app/Contents/Versions/${major}/bin/${tool}`,
    `/Applications/Postgres.app/Contents/Versions/latest/bin/${tool}`,
    `/opt/homebrew/opt/postgresql@${major}/bin/${tool}`,
    `/usr/local/opt/postgresql@${major}/bin/${tool}`,
    tool,
  ];
  for (const c of candidates) {
    try {
      const out = execFileSync(c, ["--version"], { encoding: "utf8" });
      const m = /(\d+)\./.exec(out);
      if (m && Number(m[1]) >= major) return c;
    } catch {}
  }
  fail(`No encontré ${tool} versión ${major} o mayor. En Postgres.app: menú del elefante → Settings → agregá la versión ${major}, o instalá con: brew install postgresql@${major}`);
}
async function counts(url) {
  const c = await connect(url);
  const tables = (await c.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name`)).rows.map((r) => r.table_name);
  const out = {};
  for (const t of tables) out[t] = Number((await c.query(`SELECT count(*)::int AS n FROM "public"."${t}"`)).rows[0].n);
  await c.end();
  return out;
}

// 1
step(1, "Backup de producción (solo lectura)");
const b = await backup(prodUrl, "-ensayo-json");
ok("Backup JSON en " + b.dir);
const prodCounts = Object.fromEntries(Object.entries(b.counts));

// 2
step(2, "Copia exacta de producción con pg_dump (solo lectura)");
const major = await serverMajor(prodUrl);
const pgDump = findPgBin("pg_dump", major);
const pgRestore = findPgBin("pg_restore", major);
const dumpFile = path.join(dir, "produccion.dump");
execFileSync(pgDump, ["--format=custom", "--no-owner", "--no-privileges", "--file", dumpFile, prodUrl], { stdio: ["ignore", "inherit", "inherit"] });
const sizeMb = (fs.statSync(dumpFile).size / 1024 / 1024).toFixed(2);
ok(`Copia guardada: ${dumpFile} (${sizeMb} MB, Postgres ${major})`);

// 3
step(3, `Restaurar la copia en la base nueva "${ENSAYO_DB}" (tu base de desarrollo no se toca)`);
{
  const c = await connect(adminUrl);
  await c.query(`DROP DATABASE IF EXISTS "${ENSAYO_DB}"`);
  await c.query(`CREATE DATABASE "${ENSAYO_DB}"`);
  await c.end();
}
execFileSync(pgRestore, ["--no-owner", "--no-privileges", "--exit-on-error", "--dbname", ensayoUrl, dumpFile], { stdio: ["ignore", "inherit", "inherit"] });
ok("Copia restaurada");

// 4
step(4, "¿La copia tiene exactamente los mismos datos que producción?");
const restored = await counts(ensayoUrl);
let restoreOk = true;
informe.push("## 1. Recuperación del backup", "", "| Tabla | Producción | Copia restaurada | OK |", "|---|---:|---:|:-:|");
for (const t of Object.keys(prodCounts)) {
  const same = restored[t] === prodCounts[t];
  if (!same) restoreOk = false;
  informe.push(`| ${t} | ${prodCounts[t]} | ${restored[t] ?? "falta"} | ${same ? "✓" : "✗"} |`);
}
console.table(Object.fromEntries(Object.keys(prodCounts).map((t) => [t, { produccion: prodCounts[t], copia: restored[t] }])));
if (!restoreOk) { fs.writeFileSync(path.join(dir, "INFORME.md"), informe.join("\n")); fail("La copia NO coincide con producción. Frená acá y revisá el informe."); }
ok("La copia coincide fila por fila con producción: el backup se puede recuperar.");

// 5
step(5, "Aplicar las migraciones pendientes a la COPIA (mismo comando que en producción)");
const c5 = await connect(ensayoUrl);
const applied = new Set((await c5.query(`SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`)).rows.map((r) => r.migration_name));
await c5.end();
const local = fs.readdirSync("prisma/migrations").filter((d) => fs.existsSync(path.join("prisma/migrations", d, "migration.sql"))).sort();
const pending = local.filter((m) => !applied.has(m));
console.log("Pendientes: " + (pending.length ? "\n  - " + pending.join("\n  - ") : "ninguna"));
informe.push("", "## 2. Migraciones aplicadas en el ensayo", "", ...(pending.length ? pending.map((m) => "- " + m) : ["(ninguna pendiente)"]));
let migrateOut = "";
try {
  migrateOut = execFileSync("npx", ["prisma", "migrate", "deploy"], { encoding: "utf8", env: { ...process.env, DATABASE_URL: ensayoUrl } });
  console.log(migrateOut);
} catch (e) {
  const msg = (e.stdout || "") + (e.stderr || "") || String(e);
  informe.push("", "### ✗ La migración FALLÓ en el ensayo", "", "```", msg.slice(0, 4000), "```");
  fs.writeFileSync(path.join(dir, "INFORME.md"), informe.join("\n"));
  fail("La migración falló en la COPIA (producción no se tocó). Mirá " + path.join(dir, "INFORME.md"));
}
ok("Migraciones aplicadas en la copia sin errores");

// 6
step(6, "¿Alguna tabla existente perdió datos?");
const after = await counts(ensayoUrl);
let lost = false;
informe.push("", "## 3. Antes y después de migrar (en la copia)", "", "| Tabla | Antes | Después | |", "|---|---:|---:|---|");
for (const t of Object.keys({ ...prodCounts, ...after })) {
  const before = prodCounts[t];
  const now = after[t];
  let mark = "✓ igual";
  if (before === undefined) mark = "nueva";
  else if (t === "_prisma_migrations") mark = now >= before ? "✓ registro de migraciones" : "✗";
  else if (now !== before) { mark = "✗ CAMBIÓ"; lost = true; }
  informe.push(`| ${t} | ${before ?? "—"} | ${now ?? "—"} | ${mark} |`);
}
console.table(Object.fromEntries(Object.keys({ ...prodCounts, ...after }).map((t) => [t, { antes: prodCounts[t] ?? "—", despues: after[t] ?? "—" }])));
if (lost) { fs.writeFileSync(path.join(dir, "INFORME.md"), informe.join("\n")); fail("Alguna tabla cambió de cantidad de filas. NO subir. Mirá el informe."); }

informe.push("", "## Resultado", "", "✓ El backup de producción se recupera completo.", "✓ Las migraciones se aplican sin errores sobre una copia real.", "✓ Ninguna tabla existente perdió ni cambió filas.", "", `Copia de producción guardada en \`${dumpFile}\` (sirve para restaurar si algún día hiciera falta).`);
fs.writeFileSync(path.join(dir, "INFORME.md"), informe.join("\n"));
console.log("\n\x1b[42m\x1b[30m ENSAYO OK \x1b[0m Informe: " + path.join(dir, "INFORME.md"));
console.log(`La base "${ENSAYO_DB}" queda en tu Mac por si querés mirarla. Producción no se tocó.\n`);
