-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cashRegisterSessionId" TEXT,
ADD COLUMN     "channel" TEXT NOT NULL DEFAULT 'ONLINE',
ADD COLUMN     "paymentMethod" TEXT,
ALTER COLUMN "shippingAddress" DROP NOT NULL;

-- CreateTable
CREATE TABLE "CashRegisterSession" (
    "id" TEXT NOT NULL,
    "openedById" TEXT NOT NULL,
    "openingAmount" DECIMAL(10,2) NOT NULL,
    "cartItems" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "closingAmountCounted" DECIMAL(10,2),

    CONSTRAINT "CashRegisterSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CashRegisterSession_status_idx" ON "CashRegisterSession"("status");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_cashRegisterSessionId_fkey" FOREIGN KEY ("cashRegisterSessionId") REFERENCES "CashRegisterSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashRegisterSession" ADD CONSTRAINT "CashRegisterSession_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
