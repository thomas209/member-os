-- Ajustes simples de la app (clave/valor), ej. el interruptor del bot.
-- Solo una tabla nueva. No toca ninguna tabla existente.

-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);
