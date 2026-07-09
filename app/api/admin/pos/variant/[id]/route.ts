import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const variant = await prisma.productVariant.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            colorName: true,
            colorHex: true,
            isActive: true,
            deletedAt: true,
            brand: { select: { name: true } },
            images: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
    });

    if (!variant || !variant.product.isActive || variant.product.deletedAt) {
      return NextResponse.json({ error: "Producto no encontrado o inactivo" }, { status: 404 });
    }

    return NextResponse.json({
      variantId: variant.id,
      productId: variant.product.id,
      name: variant.product.name,
      brand: variant.product.brand.name,
      size: variant.size,
      colorName: variant.product.colorName,
      colorHex: variant.product.colorHex,
      price: Number(variant.product.price),
      stock: variant.stock,
      image: variant.product.images[0]?.url ?? null,
    });
  } catch (error) {
    console.error("Error buscando variante:", error);
    return NextResponse.json({ error: "Error al buscar el producto" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
