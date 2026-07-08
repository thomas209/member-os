import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, slug, description, brandId, categoryId, gender, price, comparePrice, costPrice, colorName, colorHex, groupSlug, isFeatured, isEncargo, variants, images } = body;

    if (!name || !price || !brandId || !categoryId) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        brandId,
        categoryId,
        gender: gender || "UNISEX",
        price,
        comparePrice: comparePrice || null,
        costPrice: costPrice || null,
        colorName: colorName || null,
        colorHex: colorHex || null,
        groupSlug: groupSlug || null,
        isFeatured: isFeatured || false,
        isEncargo: isEncargo || false,
        isActive: true,
        variants: {
          create: variants?.map((v: any, i: number) => ({
            size: v.size,
            stock: v.stock || 0,
            sortOrder: i,
          })) || [],
        },
        images: {
          create: images?.map((img: any) => ({
            url: img.url,
            isPrimary: img.isPrimary || false,
            sortOrder: img.sortOrder || 0,
          })) || [],
        },
      },
    });

    // Registrar StockMovement para cada variante
    for (const variant of variants || []) {
      if (variant.stock > 0) {
        const createdVariant = await prisma.productVariant.findFirst({
          where: { productId: product.id, size: variant.size },
        });
        if (createdVariant) {
          await prisma.stockMovement.create({
            data: {
              variantId: createdVariant.id,
              type: "RESTOCK",
              quantity: variant.stock,
              previousStock: 0,
              newStock: variant.stock,
              createdBy: "admin:backoffice",
              note: "Stock inicial al crear producto",
            },
          });
        }
      }
    }

    return NextResponse.json({ product: { id: product.id, slug: product.slug } }, { status: 201 });
  } catch (error: any) {
    console.error(error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "El slug ya existe" }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al crear producto" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
