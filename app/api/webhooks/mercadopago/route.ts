import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { payment } from "@/lib/mercadopago";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // MP envia distintos tipos de notificaciones
    if (body.type !== "payment") {
      return NextResponse.json({ received: true });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      return NextResponse.json({ received: true });
    }

    // Consultar el estado real del pago a MP
    const mpPayment = await payment.get({ id: paymentId });

    const orderId = mpPayment.external_reference;
    const status = mpPayment.status;

    if (!orderId) {
      return NextResponse.json({ received: true });
    }

    // Buscar la orden
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ received: true });
    }

    // Pago aprobado
    if (status === "approved" && order.status === "PENDING") {
      await prisma.$transaction(async (tx) => {
        // Actualizar orden
        await tx.order.update({
          where: { id: orderId },
          data: {
            status: "PAID",
            paymentId: String(paymentId),
            paymentStatus: status,
          },
        });

        // Descontar stock y registrar movimientos
        for (const item of order.items) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
          });

          if (variant) {
            const newStock = Math.max(0, variant.stock - item.quantity);

            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: newStock },
            });

            await tx.stockMovement.create({
              data: {
                variantId: item.variantId,
                type: "PURCHASE",
                quantity: -item.quantity,
                previousStock: variant.stock,
                newStock,
                orderId: order.id,
                createdBy: "webhook:mercadopago",
              },
            });
          }
        }

        // Incrementar uso del cupon
        if (order.couponId) {
          await tx.coupon.update({
            where: { id: order.couponId },
            data: { usedCount: { increment: 1 } },
          });
        }
      });

      console.log("Pago aprobado — Orden:", order.orderNumber);
    }

    // Pago rechazado o cancelado
    if (["rejected", "cancelled"].includes(status) && order.status === "PENDING") {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "CANCELLED",
          paymentId: String(paymentId),
          paymentStatus: status,
        },
      });

      console.log("Pago rechazado — Orden:", order.orderNumber);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    // Siempre respondemos 200 para que MP no reintente
    return NextResponse.json({ received: true });
  }
}
