-- Restaura las columnas del CRM / login de clientes que el codigo usa desde
-- julio pero que nunca tuvieron migracion (se habian creado con db push).
--
-- SOLO AGREGA. No borra ni modifica ninguna fila ni columna existente.
-- IF NOT EXISTS: si alguna ya existe, la saltea sin error.

BEGIN;

ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "loginToken" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "loginTokenExpiresAt" TIMESTAMP(3);
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE UNIQUE INDEX IF NOT EXISTS "Customer_loginToken_key" ON "Customer"("loginToken");

COMMIT;
