-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "isEncargo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trackingNumber" TEXT,
ADD COLUMN     "shippedAt" TIMESTAMP(3);
