// UNICA forma de aplicar cambios de base a PRODUCCION.
//
//   npm run db:deploy-prod
//
// Pasos (se corta ante cualquier problema):
//   1. Muestra que migraciones faltan aplicar en produccion.
//   2. Revisa el SQL de cada una y avisa si tiene algo destructivo
//      (DROP, DELETE, TRUNCATE, ...). Si lo tiene, pide confirmacion extra.
//   3. Hace un backup completo de produccion.
//   4. Pide escribir "APLICAR EN PRODUCCION".
//   5. Corre `prisma migrate deploy` (solo aplica migraciones pendientes,
//      NUNCA resetea ni borra la base).
//   6. Hace otro backup y compara las cantidades de filas tabla por tabla.
import fs from "fs";
import path from "path";
import readline from "readline/promises";
import { execSync } from "child_process";
import { getProdUrl, connect, describeUrl, fail } from "./lib/db-env.mjs";
import { backup } from "./db-backup.mjs";

const prodUrl = getProdUrl();
console.log("\nPRODUCCION: " + describeUrl(prodUrl) + "\n");

// 1. Migraciones pendientes
const client = await connect(prodUrl);
const applied = new Set((await client.query(
  `SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`
)).rows.map((r) => r.migration_name));
await client.end();

const local = fs.readdirSync("prisma/migrations").filter((d) => fs.existsSync(path.join("prisma/migrations", d, "migration.sql"))).sort();
const missingInRepo = [...applied].filter((m) => !local.includes(m));
if (missingInRepo.length) fail("Produccion tiene migraciones que no estan en el repo: " + missingInRepo.join(", ") + "\n  Hay que traerlas al repo antes de seguir.");

const pending = local.filter((m) => !applied.has(m));
if (!pending.length) { console.log("✓ Produccion esta al dia. No hay nada para aplicar."); process.exit(0); }

// 2. Revision del SQL
const DANGER = /\b(DROP\s+(TABLE|COLUMN|TYPE|INDEX|SCHEMA|DATABASE)|DELETE\s+FROM|TRUNCATE|ALTER\s+COLUMN\s+\S+\s+(SET\s+DATA\s+)?TYPE|RENAME)\b/i;
let dangerous = false;
for (const m of pending) {
  const sql = fs.readFileSync(path.join("prisma/migrations", m, "migration.sql"), "utf8");
  const bad = sql.split("\n").filter((l) => !l.trim().startsWith("--") && DANGER.test(l));
  console.log((bad.length ? "⚠️  " : "✓ ") + m);
  bad.forEach((l) => console.log("     DESTRUCTIVO: " + l.trim()));
  if (bad.length) dangerous = true;
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
if (dangerous) {
  console.log("\n⚠️  Hay operaciones que pueden BORRAR datos. Revisalas antes de seguir.");
  const a = await rl.question('Escribi "ENTIENDO EL RIESGO" para continuar: ');
  if (a.trim() !== "ENTIENDO EL RIESGO") { rl.close(); fail("Cancelado."); }
}

// 3. Backup previo
console.log("\nBackup previo de produccion...");
const before = await backup(prodUrl, "-pre-deploy");
console.log("✓ Backup en " + before.dir);

// 4. Confirmacion
const ok = await rl.question('\nEscribi "APLICAR EN PRODUCCION" para aplicar ' + pending.length + " migracion(es): ");
rl.close();
if (ok.trim() !== "APLICAR EN PRODUCCION") fail("Cancelado. No se aplico nada.");

// 5. migrate deploy (nunca resetea)
execSync("npx prisma migrate deploy", { stdio: "inherit", env: { ...process.env, DATABASE_URL: prodUrl } });

// 6. Verificacion
const after = await backup(prodUrl, "-post-deploy");
const rows = Object.keys({ ...before.counts, ...after.counts }).map((t) => ({
  tabla: t, antes: before.counts[t] ?? "-", despues: after.counts[t] ?? "-",
  ok: before.counts[t] === after.counts[t] ? "✓" : "REVISAR",
}));
console.table(rows);
const lost = rows.filter((r) => typeof r.antes === "number" && (r.despues === "-" || r.despues < r.antes));
if (lost.length) console.log("\n⚠️  ATENCION: hay tablas con menos filas. Backup previo en " + before.dir);
else console.log("\n✓ Deploy terminado. Ninguna tabla perdio filas.");
