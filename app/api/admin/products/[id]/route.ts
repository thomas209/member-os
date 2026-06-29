import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error al archivar producto" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { variants, images, ...productData } = body;

    await prisma.$transaction(async (tx) => {
      // Actualizar producto
      await tx.product.update({
        where: { id },
        data: {
          ...productData,
          price: productData.price ? Number(productData.price) : undefined,
          comparePrice: productData.comparePrice ? Number(productData.comparePrice) : null,
          costPrice: productData.costPrice ? Number(productData.costPrice) : null,
        },
      });

      // Actualizar variantes si se enviaron
      if (variants && Array.isArray(variants)) {
        for (const v of variants) {
          await tx.productVariant.upsert({
            where: { productId_size: { productId: id, size: v.size } },
            update: { stock: Number(v.stock) },
            create: {
              productId: id,
              size: v.size,
              stock: Number(v.stock),
              sortOrder: Number(v.size) || 0,
            },
          });
        }
      }

      // Actualizar imagenes si se enviaron
      if (images && Array.isArray(images)) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (images.length > 0) {
          await tx.productImage.createMany({
            data: images.map((url: string, i: number) => ({
              productId: id,
              url,
              isPrimary: i === 0,
              sortOrder: i,
            })),
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al actualizar producto" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
