// Copia los datos de un backup de produccion a la base LOCAL, para
// desarrollar con datos reales. Nunca se conecta a produccion: lee los
// archivos JSON de backups/.
//
//   npm run db:copy-to-local                 -> usa el backup mas reciente
//   npm run db:copy-to-local -- backups/XXX  -> usa uno puntual
//
// Solo corre si DATABASE_URL es localhost. Vacia las tablas LOCALES y las
// llena con el backup.
import fs from "fs";
import path from "path";
import { getLocalUrl, isLocalUrl, describeUrl, connect, fail } from "./lib/db-env.mjs";

const url = getLocalUrl();
if (!isLocalUrl(url)) fail("La base destino no es local (" + describeUrl(url) + "). No copio nada.");

let dir = process.argv[2];
if (!dir) {
  const all = fs.existsSync("backups")
    ? fs.readdirSync("backups").filter((d) => !d.endsWith("-local")).sort()
    : [];
  if (!all.length) fail("No hay backups en backups/. Corre primero: npm run db:backup");
  dir = path.join("backups", all[all.length - 1]);
}
console.log("Copiando " + dir + " -> " + describeUrl(url));

const client = await connect(url);
const tables = (await client.query(
  `SELECT table_name FROM information_schema.tables
   WHERE table_schema='public' AND table_type='BASE TABLE' AND table_name <> '_prisma_migrations'`
)).rows.map((r) => r.table_name);

await client.query("BEGIN");
// Desactiva los chequeos de claves foraneas solo durante la copia (local).
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
console.log("✓ Base local lista con los datos de " + dir);
