import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendQuoteRequestNotification } from "@/lib/email";

// ============================================================
// TOOL 1 — Buscar productos reales en el catalogo.
// El asistente SIEMPRE tiene que usar esto para recomendar productos:
// nunca puede inventar nombres, precios o stock.
// ============================================================

export const searchProducts = tool({
  description:
    "Busca productos en el catalogo real de Member Club. Usar siempre que el cliente pida una recomendacion, mencione una marca/categoria/talle, o pregunte si hay stock de algo. Nunca inventar productos: solo recomendar lo que devuelve esta tool.",
  inputSchema: z.object({
    query: z
      .string()
      .optional()
      .describe("Palabras clave libres para buscar en nombre/descripcion, ej: 'zapatilla running', 'campera negra'"),
    categorySlug: z.string().optional().describe("Slug de categoria si el cliente la menciono explicitamente"),
    brandSlug: z.string().optional().describe("Slug de marca si el cliente la menciono explicitamente"),
    gender: z.enum(["HOMBRE", "MUJER", "UNISEX", "NINO"]).optional(),
    size: z.string().optional().describe("Talle que busca el cliente, para filtrar solo variantes con stock en ese talle"),
    maxPrice: z.number().optional().describe("Precio maximo en pesos argentinos"),
  }),
  execute: async ({ query, categorySlug, brandSlug, gender, size, maxPrice }) => {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        ...(categorySlug && { category: { slug: categorySlug } }),
        ...(brandSlug && { brand: { slug: brandSlug } }),
        ...(gender && { gender }),
        ...(maxPrice && { price: { lte: maxPrice } }),
        ...(query && {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        }),
        ...(size && { variants: { some: { size: { contains: size, mode: "insensitive" }, stock: { gt: 0 } } } }),
      },
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true } },
        images: { where: { isPrimary: true }, take: 1 },
        variants: { select: { size: true, stock: true } },
      },
      orderBy: { isFeatured: "desc" },
      take: 8,
    });

    if (products.length === 0) {
      return {
        found: false,
        message: "No se encontraron productos que matcheen esa busqueda en el catalogo.",
      };
    }

    return {
      found: true,
      products: products.map((p) => ({
        name: p.name,
        brand: p.brand.name,
        category: p.category.name,
        price: Number(p.price),
        onSale: p.salePrice ? Number(p.salePrice) : null,
        colorName: p.colorName,
        isEncargo: p.isEncargo,
        image: p.images[0]?.url ?? null,
        url: (process.env.NEXT_PUBLIC_URL || "") + "/product/" + p.slug,
        sizesInStock: p.variants.filter((v) => v.stock > 0).map((v) => v.size),
      })),
    };
  },
});

// ============================================================
// TOOL 2 — Crear una solicitud de cotizacion.
// Se usa SOLO despues de que el cliente confirmo que quiere mandar
// foto/link de algo que no esta en el catalogo, y ya dio los datos
// minimos (descripcion + foto o link + algun contacto).
// ============================================================

export const createQuoteRequest = tool({
  description:
    "Guarda una solicitud de cotizacion cuando search_products no encontro lo que el cliente busca y el cliente decidio mandar una foto o un link para que Member Club se lo cotice. Llamar SOLO una vez que el cliente ya mando foto y/o link, y un contacto (email o telefono) para poder responderle. No llamar si todavia falta algun dato: en ese caso, pedirlo primero en texto.",
  inputSchema: z.object({
    description: z.string().describe("Resumen breve de que producto esta buscando el cliente"),
    imageUrl: z.string().optional().describe("URL de la foto que subio el cliente, si mando una"),
    productLink: z.string().optional().describe("Link al producto que mando el cliente, si mando uno"),
    size: z.string().optional(),
    contactEmail: z.string().optional(),
    contactPhone: z.string().optional(),
  }),
  execute: async ({ description, imageUrl, productLink, size, contactEmail, contactPhone }) => {
    if (!imageUrl && !productLink) {
      return { ok: false, message: "Falta la foto o el link del producto — pedirselo al cliente antes de guardar." };
    }
    if (!contactEmail && !contactPhone) {
      return { ok: false, message: "Falta un contacto (email o telefono) — pedirselo al cliente antes de guardar." };
    }

    const quoteRequest = await prisma.quoteRequest.create({
      data: {
        description,
        imageUrl,
        productLink,
        size,
        guestEmail: contactEmail,
        guestPhone: contactPhone,
      },
    });

    // No bloquea la confirmacion al cliente si el mail falla
    sendQuoteRequestNotification({
      description,
      imageUrl,
      productLink,
      size,
      contactEmail,
      contactPhone,
    }).catch((err) => console.error("Error mandando aviso de cotizacion:", err));

    return {
      ok: true,
      id: quoteRequest.id,
      message: "Solicitud guardada. Confirmarle al cliente que Member Club lo va a contactar a la brevedad con el precio.",
    };
  },
});

export const assistantTools = {
  search_products: searchProducts,
  create_quote_request: createQuoteRequest,
};
