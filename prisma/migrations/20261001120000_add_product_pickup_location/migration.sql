-- Lugar de retiro (pick up) por producto: PINAMAR, CABA o AMBOS.
--
-- SOLO AGREGA una columna. No borra ni modifica ninguna fila ni columna existente.
-- IF NOT EXISTS: si la columna ya existe, la saltea sin error.
-- Todos los productos existentes quedan en 'PINAMAR' (como estaban hasta hoy).

BEGIN;

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "pickupLocation" TEXT NOT NULL DEFAULT 'PINAMAR';

COMMIT;
