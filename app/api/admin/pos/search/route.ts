import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Buscador manual de productos para el POS: fallback cuando el QR
// esta roto, despegado, o el producto no tiene etiqueta.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();

    if (q.length < 2) {
      return NextResponse.json({ products: [] });
    }

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        name: { contains: q, mode: "insensitive" },
      },
      take: 8,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        price: true,
        colorName: true,
        colorHex: true,
        brand: { select: { name: true } },
        images: { where: { isPrimary: true }, take: 1 },
        variants: {
          select: { id: true, size: true, stock: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json({
      products: products
        .filter((p) => p.variants.length > 0)
        .map((p) => ({
          productId: p.id,
          name: p.name,
          brand: p.brand.name,
          colorName: p.colorName,
          colorHex: p.colorHex,
          price: Number(p.price),
          image: p.images[0]?.url ?? null,
          variants: p.variants,
        })),
    });
  } catch (error) {
    console.error("Error buscando productos:", error);
    return NextResponse.json({ error: "Error al buscar productos" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
