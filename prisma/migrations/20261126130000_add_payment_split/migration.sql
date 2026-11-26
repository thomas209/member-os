-- Pago dividido en el punto de venta (efectivo + tarjeta + transferencia).
-- Solo agrega una columna opcional a "Order". No toca ni borra datos existentes:
-- las ventas viejas quedan con paymentSplit en NULL.

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "paymentSplit" JSONB;
