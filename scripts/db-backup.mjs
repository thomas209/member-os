// BACKUP DE LA BASE — SOLO LECTURA.
// Copia todas las tablas a backups/<fecha>/<Tabla>.json y muestra cuantas
// filas tiene cada una. Corre dentro de una transaccion READ ONLY: Postgres
// rechaza cualquier escritura, asi que es imposible que modifique o borre algo.
//
// Uso: node scripts/db-backup.mjs
import pg from "pg";
import fs from "fs";
import path from "path";

const env = fs.readFileSync(".env", "utf8");
const url = env.match(/^DATABASE_URL="?([^"\n]+)"?/m)?.[1];
if (!url) throw new Error("No encontre DATABASE_URL en .env");

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
await client.query("BEGIN TRANSACTION READ ONLY");

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const dir = path.join("backups", stamp);
fs.mkdirSync(dir, { recursive: true });

const tables = (await client.query(
  `SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name`
)).rows.map((r) => r.table_name);

const counts = {};
for (const t of tables) {
  const rows = (await client.query(`SELECT * FROM "public"."${t}"`)).rows;
  fs.writeFileSync(path.join(dir, t + ".json"), JSON.stringify(rows, null, 2));
  counts[t] = rows.length;
}
const customerCols = (await client.query(
  `SELECT column_name FROM information_schema.columns WHERE table_name = 'Customer' ORDER BY ordinal_position`
)).rows.map((r) => r.column_name);

fs.writeFileSync(path.join(dir, "_resumen.json"), JSON.stringify({ counts, customerCols }, null, 2));
await client.query("ROLLBACK");
await client.end();

console.log("Backup guardado en " + dir + "\n");
console.table(counts);
console.log("Columnas de Customer:", customerCols.join(", "));
