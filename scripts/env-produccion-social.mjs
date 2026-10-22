// Imprime en TU terminal el bloque de variables para Vercel (modulo de redes).
// Toma 3 valores de tu .env local y genera 2 claves nuevas para produccion.
// No manda nada a ningun lado. Copiá la salida y pegala en Vercel.
import crypto from "crypto";
import { readEnvFile } from "./lib/db-env.mjs";

const env = readEnvFile(".env");
const faltan = ["ANTHROPIC_API_KEY", "ANTHROPIC_MODEL", "AI_MONTHLY_BUDGET_USD"].filter((k) => !env[k]);
if (faltan.length) { console.error("Faltan en .env: " + faltan.join(", ")); process.exit(1); }

const lines = [
  "FEATURE_SOCIAL=true",
  "NEXT_PUBLIC_FEATURE_SOCIAL=true",
  "ANTHROPIC_API_KEY=" + env.ANTHROPIC_API_KEY,
  "ANTHROPIC_MODEL=" + env.ANTHROPIC_MODEL,
  "AI_MONTHLY_BUDGET_USD=" + env.AI_MONTHLY_BUDGET_USD,
  "SOCIAL_TOKEN_KEY=" + crypto.randomBytes(32).toString("base64"),
  "CRON_SECRET=" + crypto.randomBytes(24).toString("hex"),
];
console.log("\n----- COPIÁ DESDE ACÁ -----\n" + lines.join("\n") + "\n----- HASTA ACÁ -----\n");
console.log("Guardá CRON_SECRET en un lugar seguro: se usa después para el cron.\n");
