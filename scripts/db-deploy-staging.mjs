// Aplica las migraciones pendientes en la base de TESTING (staging).
//
//   npm run db:deploy-staging
//
// Usa `prisma migrate deploy` (nunca resetea ni borra). La URL sale de
// .env.staging y se verifica que no sea produccion ni la base local.
import { execSync } from "child_process";
import { getStagingUrl, describeUrl } from "./lib/db-env.mjs";

const url = getStagingUrl();
console.log("\nSTAGING: " + describeUrl(url) + "\n");
execSync("npx prisma migrate deploy", {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: url },
});
console.log("\n✓ Staging al dia con las migraciones del repo.");
