// Copia los datos de un backup de produccion a la base de TESTING (staging),
// para probar con datos reales. Nunca se conecta a produccion: lee los
// archivos JSON de backups/ (los genera `npm run db:backup`).
//
//   npm run db:copy-to-staging                 -> usa el backup mas reciente
//   npm run db:copy-to-staging -- backups/XXX  -> usa uno puntual
//
// Antes: `npm run db:deploy-staging` para que staging tenga las tablas.
// Vacia las tablas de STAGING y las llena con el backup. La URL sale de
// .env.staging y se verifica que no sea produccion ni la base local.
// Ojo: staging queda con datos de clientes; no se comparte.
import fs from "fs";
import path from "path";
import readline from "readline/promises";
import { getStagingUrl, describeUrl, connect, fail } from "./lib/db-env.mjs";

const url = getStagingUrl();

let dir = process.argv[2];
if (!dir) {
  const all = fs.existsSync("backups")
    ? fs.readdirSync("backups").filter((d) => !d.endsWith("-local")).sort()
    : [];
  if (!all.length) fail("No hay backups en backups/. Corre primero: npm run db:backup");
  dir = path.join("backups", all[all.length - 1]);
}

console.log("\nCopiar " + dir + "  ->  STAGING " + describeUrl(url));
console.log("Esto VACIA las tablas de staging y las reemplaza con el backup.\n");
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const answer = await rl.question('Escribi "COPIAR A STAGING" para seguir: ');
rl.close();
if (answer.trim() !== "COPIAR A STAGING") fail("Cancelado.");

const client = await connect(url);
const tables = (await client.query(
  `SELECT table_name FROM information_schema.tables
   WHERE table_schema='public' AND table_type='BASE TABLE' AND table_name <> '_prisma_migrations'`
)).rows.map((r) => r.table_name);
if (!tables.length) fail("Staging no tiene tablas. Corre primero: npm run db:deploy-staging");

await client.query("BEGIN");
await client.query("SET session_replication_role = replica");
await client.query("TRUNCATE " + tables.map((t) => `"${t}"`).join(", ") + " CASCADE");

const result = {};
for (const t of tables) {
  const file = path.join(dir, t + ".json");
  if (!fs.existsSync(file)) { result[t] = "sin archivo"; continue; }
  const rows = JSON.parse(fs.readFileSync(file, "utf8"));
  const types = Object.fromEntries((await client.query(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name=$1`, [t]
  )).rows.map((r) => [r.column_name, r.data_type]));
  for (const row of rows) {
    const cols = Object.keys(row).filter((c) => c in types);
    const vals = cols.map((c) =>
      (types[c] === "json" || types[c] === "jsonb") && row[c] !== null ? JSON.stringify(row[c]) : row[c]
    );
    await client.query(
      `INSERT INTO "${t}" (${cols.map((c) => `"${c}"`).join(",")}) VALUES (${cols.map((_, i) => "$" + (i + 1)).join(",")})`,
      vals
    );
  }
  result[t] = rows.length;
}
await client.query("SET session_replication_role = DEFAULT");
await client.query("COMMIT");
await client.end();
console.table(result);
console.log("✓ Staging lista con los datos de " + dir);
