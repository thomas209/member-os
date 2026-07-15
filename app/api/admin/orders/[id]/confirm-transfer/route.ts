import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmail } from "@/lib/email";

// Confirma a mano que la transferencia llego (no hay forma automatica de
// saberlo). Recien aca se descuenta stock — mismo patron atomico que el
// webhook de Mercado Pago, para que dos pedidos por el mismo talle no
// puedan confirmarse de mas.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { include: { images: { orderBy: { isPrimary: "desc" }, take: 1 } } },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }
    if (order.paymentMethod !== "TRANSFERENCIA") {
      return NextResponse.json({ error: "Este pedido no es por transferencia" }, { status: 400 });
    }
    if (order.status !== "PENDING") {
      return NextResponse.json({ error: "Este pedido ya no esta pendiente" }, { status: 400 });
    }

    const oversoldItems: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
        if (!variant) continue;

        const result = await tx.productVariant.updateMany({
          where: { id: item.variantId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });

        if (result.count === 0) {
          oversoldItems.push(item.productName + " (talle " + item.size + ")");
          await tx.stockMovement.create({
            data: {
              variantId: item.variantId, type: "PURCHASE", quantity: 0,
              previousStock: variant.stock, newStock: variant.stock,
              orderId: order.id, createdBy: "admin:" + String(token.email || token.id),
              note: "Transferencia confirmada sin stock suficiente — revisar a mano",
            },
          });
          continue;
        }

        await tx.stockMovement.create({
          data: {
            variantId: item.variantId, type: "PURCHASE", quantity: -item.quantity,
            previousStock: variant.stock, newStock: variant.stock - item.quantity,
            orderId: order.id, createdBy: "admin:" + String(token.email || token.id),
          },
        });
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          paymentStatus: "approved",
          ...(oversoldItems.length > 0 && {
            notes:
              (order.notes ? order.notes + "\n" : "") +
              "⚠ Sin stock suficiente al confirmar la transferencia: " +
              oversoldItems.join(", ") +
              ". Puede requerir reembolso parcial o contactar al cliente.",
          }),
        },
      });

      if (order.couponId) {
        await tx.coupon.update({ where: { id: order.couponId }, data: { usedCount: { increment: 1 } } });
      }
    });

    if (order.guestEmail) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
        await sendOrderConfirmationEmail({
          to: order.guestEmail,
          firstName: order.guestFirstName || "",
          orderNumber: order.orderNumber,
          items: order.items.map((item) => ({
            productName: item.productName,
            productBrand: item.productBrand,
            size: item.size,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            image: item.product.images[0]?.url ?? null,
            isEncargo: item.isEncargo,
          })),
          subtotal: Number(order.subtotal),
          discountAmount: Number(order.discountAmount),
          shippingCost: Number(order.shippingCost),
          total: Number(order.total),
          receiptUrl: (process.env.NEXT_PUBLIC_URL || "http://localhost:3000") + "/receipt/" + order.id,
        });
      } catch (emailError) {
        console.error("No se pudo enviar el email de confirmacion:", emailError);
      }
    }

    return NextResponse.json({ ok: true, oversold: oversoldItems });
  } catch (error) {
    console.error("Error confirmando transferencia:", error);
    return NextResponse.json({ error: "Error al confirmar la transferencia" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
