// Sugiere el caption de un post de Instagram a partir de productos reales.
// Solo LEE productos. El resultado vuelve como borrador: nada se publica
// ni se guarda en un producto sin aprobacion.
import { prisma } from "@/lib/prisma";
import { callModel, AiError } from "./client";
import { getBrandVoice, buildBrandPrompt } from "./brandVoice";

const SITE_URL = process.env.NEXT_PUBLIC_URL || "https://www.memberclubargentina.com";

function money(n: number) {
  return "$" + Math.round(n).toLocaleString("es-AR");
}

export async function getProductsForAi(productIds: string[]) {
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      colorName: true,
      price: true,
      salePrice: true,
      saleEndsAt: true,
      isEncargo: true,
      pickupLocation: true,
      brand: { select: { name: true } },
      category: { select: { name: true } },
      variants: { where: { stock: { gt: 0 } }, select: { size: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  return products.map((p) => {
    const saleActive = p.salePrice != null && (!p.saleEndsAt || p.saleEndsAt > new Date());
    const url = `${SITE_URL}/product/${p.slug}?utm_source=instagram&utm_medium=social&utm_campaign=borrador`;
    return {
      id: p.id,
      nombre: p.name,
      marca: p.brand.name,
      categoria: p.category.name,
      color: p.colorName || undefined,
      descripcion: p.description || undefined,
      precio: money(Number(p.price)),
      precioOferta: saleActive ? money(Number(p.salePrice)) : undefined,
      tallesConStock: p.variants.map((v) => v.size),
      esEncargo: p.isEncargo,
      retiro: p.pickupLocation,
      link: url,
    };
  });
}

export async function suggestCaption(productIds: string[], note?: string) {
  if (!productIds.length) throw new AiError("Elegi al menos un producto", 400);
  const products = await getProductsForAi(productIds);
  if (!products.length) throw new AiError("No encontre esos productos", 404);

  const voice = await getBrandVoice();
  const user = [
    "Escribi el caption de un post de Instagram para estos productos.",
    "Datos reales (JSON):",
    JSON.stringify(products, null, 2),
    note ? "Indicacion extra de Tommy: " + note : "",
    "Formato: el caption listo para pegar, maximo 600 caracteres, y al final una linea con 5 a 10 hashtags. Si hay talles con stock, mencionalos. Si no hay talles con stock, no digas que hay stock. No incluyas el link (va en la bio y en la etiqueta del producto). NO menciones cuotas, descuentos, envios gratis ni promociones salvo que figuren en los datos del producto o en la indicacion extra de Tommy, aunque la voz de la marca los use como ejemplo. El precio y los talles salen solo de los datos. Responde solo con el caption, sin comillas ni explicaciones.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const result = await callModel({ system: buildBrandPrompt(voice), user, maxTokens: 600 });

  const gen = await prisma.aiGeneration.create({
    data: {
      kind: "caption",
      input: { productIds, note: note || null },
      output: result.text,
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      costUsd: result.costUsd,
    },
  });

  return { generationId: gen.id, text: result.text, products };
}

export async function markGeneration(id: string, status: "accepted" | "edited" | "discarded") {
  return prisma.aiGeneration.update({ where: { id }, data: { status } });
}
