import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const brand = searchParams.get("brand");
    const gender = searchParams.get("gender");

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        ...(category && { category: { slug: category } }),
        ...(brand && { brand: { slug: brand } }),
        ...(gender && { gender: gender as any }),
      },
      include: {
        brand: { select: { name: true, slug: true } },
        category: { select: { name: true, slug: true } },
        images: { where: { isPrimary: true }, take: 1 },
        variants: { select: { stock: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      brand: p.brand,
      category: p.category,
      gender: p.gender,
      price: p.price.toString(),
      comparePrice: p.comparePrice?.toString() ?? null,
      colorName: p.colorName,
      colorHex: p.colorHex,
      primaryImage: p.images[0]?.url ?? null,
      hasStock: p.variants.some((v) => v.stock > 0),
    }));

    return NextResponse.json({ products: formatted });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error al obtener productos" },
      { status: 500 }
    );
  }
}
export const dynamic = "force-dynamic";
