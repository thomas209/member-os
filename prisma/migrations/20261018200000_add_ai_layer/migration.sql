-- Modulo de redes e IA: solo tablas nuevas. No toca ninguna tabla existente.

-- CreateTable
CREATE TABLE "BrandVoice" (
    "id" TEXT NOT NULL,
    "tone" TEXT NOT NULL DEFAULT '',
    "doWords" TEXT[],
    "dontWords" TEXT[],
    "examples" TEXT[],
    "insights" JSONB,
    "analyzedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandVoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiGeneration" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "output" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'suggested',
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "costUsd" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiGeneration_createdAt_idx" ON "AiGeneration"("createdAt");

-- CreateIndex
CREATE INDEX "AiGeneration_kind_status_idx" ON "AiGeneration"("kind", "status");
