import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// Anula una venta del POS: repone el stock vendido, marca la orden
// como CANCELLED y revierte el uso del cupon si tenia. Solo se permite
// mientras la caja de ese turno sigue abierta — si ya se cerro, anularla
// generaria un desajuste retroactivo contra lo que ya se conto y cerro.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, cashRegisterSession: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
    }
    if (order.channel !== "POS") {
      return NextResponse.json({ error: "Esta accion es solo para ventas del local" }, { status: 400 });
    }
    if (order.status === "CANCELLED") {
      return NextResponse.json({ error: "Esta venta ya estaba anulada" }, { status: 400 });
    }
    if (!order.cashRegisterSession || order.cashRegisterSession.status !== "OPEN") {
      return NextResponse.json(
        { error: "Solo se puede anular una venta mientras la caja de ese turno sigue abierta" },
        { status: 400 }
      );
    }

    const createdBy = "pos:" + String(token.email || token.id);

    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });

      for (const item of order.items) {
        const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
        if (!variant) continue;

        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            variantId: item.variantId,
            type: "CANCELLED",
            quantity: item.quantity,
            previousStock: variant.stock,
            newStock: variant.stock + item.quantity,
            orderId: order.id,
            createdBy,
            note: "Anulacion de venta #" + order.orderNumber,
          },
        });
      }

      if (order.couponId) {
        await tx.coupon.update({
          where: { id: order.couponId },
          data: { usedCount: { decrement: 1 } },
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error anulando venta:", error);
    return NextResponse.json({ error: "Error al anular la venta" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
