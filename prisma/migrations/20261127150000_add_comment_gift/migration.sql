-- Gift card por comentar en Instagram. Solo agrega columnas y tablas nuevas:
-- no modifica ni borra datos existentes.

-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN "email" TEXT,
ADD COLUMN "firstPurchaseOnly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "source" TEXT,
ADD COLUMN "transferOnly" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "CommentRule" (
    "id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "name" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "allMedia" BOOLEAN NOT NULL DEFAULT false,
    "mediaIds" TEXT[],
    "publicReply" TEXT,
    "privateMessage" TEXT NOT NULL,
    "link" TEXT,
    "giftPercent" INTEGER,
    "giftMinAmount" INTEGER,
    "giftDays" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommentRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentReply" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "igUserId" TEXT NOT NULL,
    "igUsername" TEXT,
    "commentId" TEXT NOT NULL,
    "mediaId" TEXT,
    "commentText" TEXT,
    "token" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3),
    "email" TEXT,
    "customerId" TEXT,
    "couponCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentReply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommentReply_commentId_key" ON "CommentReply"("commentId");

-- CreateIndex
CREATE UNIQUE INDEX "CommentReply_token_key" ON "CommentReply"("token");

-- CreateIndex
CREATE INDEX "CommentReply_ruleId_createdAt_idx" ON "CommentReply"("ruleId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommentReply_ruleId_igUserId_key" ON "CommentReply"("ruleId", "igUserId");

-- AddForeignKey
ALTER TABLE "CommentReply" ADD CONSTRAINT "CommentReply_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "CommentRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
