-- Modulo de redes e IA: solo una tabla nueva. No toca ninguna tabla existente.

-- CreateTable
CREATE TABLE "SocialTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "canvaDesignId" TEXT NOT NULL,
    "dataset" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SocialTemplate_canvaDesignId_key" ON "SocialTemplate"("canvaDesignId");
