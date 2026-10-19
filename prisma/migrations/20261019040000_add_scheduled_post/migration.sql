-- Modulo de redes e IA: solo una tabla nueva. No toca ninguna tabla existente.

-- CreateTable
CREATE TABLE "ScheduledPost" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "productIds" TEXT[],
    "caption" TEXT NOT NULL,
    "mediaUrls" TEXT[],
    "mediaType" TEXT NOT NULL DEFAULT 'image',
    "scheduledAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "idempotencyKey" TEXT NOT NULL,
    "remoteId" TEXT,
    "permalink" TEXT,
    "lastError" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "approvedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledPost_idempotencyKey_key" ON "ScheduledPost"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ScheduledPost_status_scheduledAt_idx" ON "ScheduledPost"("status", "scheduledAt");
