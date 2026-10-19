// TRABA DE SEGURIDAD. Se ejecuta antes de cualquier comando de Prisma que
// pueda borrar o reescribir la base (migrate dev, migrate reset, db push)
// y antes de `npm run dev`. Si DATABASE_URL no apunta a la base local,
// corta todo con error y el comando peligroso nunca llega a correr.
import { getLocalUrl, isLocalUrl, describeUrl, fail } from "./lib/db-env.mjs";

const url = getLocalUrl();
if (!isLocalUrl(url)) {
  fail(
    "DATABASE_URL apunta a " + describeUrl(url) + " (NO es la base local).\n" +
    "  Este comando solo se puede correr contra la base de desarrollo.\n" +
    "  Para produccion usa: npm run db:deploy-prod"
  );
}
console.log("✓ Base local (" + describeUrl(url) + ")");
