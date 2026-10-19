// Voz de la marca: una sola fila en BrandVoice. Se convierte en la
// instruccion de sistema de todas las llamadas a la IA.
import { prisma } from "@/lib/prisma";
import type { BrandVoice, Prisma } from "@prisma/client";

export async function getBrandVoice(): Promise<BrandVoice | null> {
  return prisma.brandVoice.findFirst({ orderBy: { updatedAt: "desc" } });
}

export async function saveBrandVoice(input: {
  tone: string;
  doWords: string[];
  dontWords: string[];
  examples: string[];
  // Si viene, es el resultado del analisis del perfil que Tommy acepto.
  insights?: Prisma.InputJsonValue;
}): Promise<BrandVoice> {
  const { insights, ...rest } = input;
  const data = insights !== undefined ? { ...rest, insights, analyzedAt: new Date() } : rest;
  const current = await getBrandVoice();
  if (current) {
    return prisma.brandVoice.update({ where: { id: current.id }, data });
  }
  return prisma.brandVoice.create({ data });
}

export function buildBrandPrompt(voice: BrandVoice | null): string {
  const lines = [
    "Sos el community manager de Member Club, una tienda de sneakers y streetwear premium de Pinamar, Argentina (memberclubargentina.com). Tiene local en Pinamar y punto de retiro en Recoleta, CABA.",
    "Escribis en espanol rioplatense, tuteando con 'vos'.",
    "Reglas: usa SOLO los datos del producto que te pasan. Si un dato no esta (precio, talle, material), no lo inventes. Nunca prometas stock, envios o descuentos que no figuren en los datos.",
  ];
  if (voice?.tone) lines.push("Tono de la marca: " + voice.tone);
  if (voice?.doWords?.length) lines.push("Palabras o expresiones que SI usa la marca: " + voice.doWords.join(", "));
  if (voice?.dontWords?.length) lines.push("Palabras o expresiones que NO usa la marca: " + voice.dontWords.join(", "));
  const ins = voice?.insights as { estiloVisual?: string; queRindeMas?: string[] } | null | undefined;
  if (ins?.queRindeMas?.length) lines.push("Lo que mejor funciona en la cuenta: " + ins.queRindeMas.join("; "));
  if (voice?.examples?.length) {
    lines.push("Ejemplos de captions reales de la marca:");
    voice.examples.forEach((e, i) => lines.push(`${i + 1}. ${e}`));
  }
  return lines.join("\n");
}
