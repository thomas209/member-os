// BACKUP — SOLO LECTURA.
// Copia todas las tablas a backups/<fecha>[-local]/<Tabla>.json y muestra
// cuantas filas tiene cada una. Corre dentro de una transaccion READ ONLY:
// Postgres rechaza cualquier escritura, es imposible que modifique algo.
//
//   npm run db:backup          -> backup de PRODUCCION (usa .env.prod-db)
//   npm run db:backup -- local -> backup de la base local
import fs from "fs";
import path from "path";
import { getProdUrl, getLocalUrl, connect, describeUrl } from "./lib/db-env.mjs";

export async function backup(url, label = "") {
  const client = await connect(url);
  await client.query("BEGIN TRANSACTION READ ONLY");

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = path.join("backups", stamp + label);
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

  fs.writeFileSync(path.join(dir, "_resumen.json"), JSON.stringify({ source: describeUrl(url), counts, customerCols }, null, 2));
  await client.query("ROLLBACK");
  await client.end();
  return { dir, counts, customerCols };
}

// Ejecucion directa
if (import.meta.url === `file://${process.argv[1]}`) {
  const local = process.argv.includes("local");
  const url = local ? getLocalUrl() : getProdUrl();
  console.log("Haciendo backup de " + (local ? "LOCAL" : "PRODUCCION") + " (" + describeUrl(url) + ")...");
  const { dir, counts, customerCols } = await backup(url, local ? "-local" : "");
  console.log("Backup guardado en " + dir + "\n");
  console.table(counts);
  console.log("Columnas de Customer:", customerCols.join(", "));
}
