// Utilidades compartidas por los scripts de base de datos.
//
// Convencion de archivos (ambos fuera de git por la regla .env* del .gitignore):
//   .env          -> DATABASE_URL de la base LOCAL de desarrollo (Postgres.app)
//   .env.prod-db  -> PROD_DATABASE_URL de la base de PRODUCCION (Railway)
//
// La URL de produccion NUNCA va en .env: asi cualquier comando de Prisma
// que se corra en la Mac (migrate dev, reset, db push...) solo puede tocar
// la base local.
import fs from "fs";
import pg from "pg";

export function readEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

export function isLocalUrl(url) {
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}

export function describeUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname + ":" + (u.port || "5432") + u.pathname;
  } catch {
    return "(URL invalida)";
  }
}

export function getLocalUrl() {
  const url = process.env.DATABASE_URL || readEnvFile(".env").DATABASE_URL;
  if (!url) fail("No hay DATABASE_URL en .env");
  return url;
}

export function getProdUrl() {
  const url = readEnvFile(".env.prod-db").PROD_DATABASE_URL;
  if (!url) fail("No encontre PROD_DATABASE_URL en .env.prod-db");
  return url;
}

export async function connect(url) {
  const ssl = isLocalUrl(url) ? false : { rejectUnauthorized: false };
  const client = new pg.Client({ connectionString: url, ssl });
  await client.connect();
  return client;
}

export function fail(msg) {
  console.error("\n\x1b[41m\x1b[37m BLOQUEADO \x1b[0m " + msg + "\n");
  process.exit(1);
}

// Base de TESTING (staging): servicio Postgres aparte en Railway.
// Vive en .env.staging -> STAGING_DATABASE_URL (fuera de git por .env*).
// Nunca puede ser la base de produccion ni la local.
export function getStagingUrl() {
  const url = readEnvFile(".env.staging").STAGING_DATABASE_URL;
  if (!url) fail("No encontre STAGING_DATABASE_URL en .env.staging");
  if (isLocalUrl(url)) fail("STAGING_DATABASE_URL apunta a la base local. Tiene que ser la base de staging de Railway.");
  const prod = readEnvFile(".env.prod-db").PROD_DATABASE_URL;
  if (prod && describeUrl(prod) === describeUrl(url)) {
    fail("STAGING_DATABASE_URL es la MISMA base que produccion (" + describeUrl(url) + "). No sigo.");
  }
  return url;
}
