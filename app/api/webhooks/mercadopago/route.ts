import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { payment } from "@/lib/mercadopago";
import { WebhookSignatureValidator, InvalidWebhookSignatureError } from "mercadopago";
import { sendOrderConfirmationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validar que la notificacion realmente venga de Mercado Pago (y no sea
    // alguien pegandole al endpoint con un external_reference inventado)
    // antes de confiar en el payload.
    const secret = process.env.MP_WEBHOOK_SECRET;
    if (secret) {
      const url = new URL(request.url);
      try {
        WebhookSignatureValidator.validate({
          xSignature: request.headers.get("x-signature"),
          xRequestId: request.headers.get("x-request-id"),
          dataId: url.searchParams.get("data.id"),
          secret,
        });
      } catch (err) {
        if (err instanceof InvalidWebhookSignatureError) {
          console.error("Webhook MP: firma invalida (" + err.reason + ")");
          return NextResponse.json({ error: "Firma invalida" }, { status: 401 });
        }
        throw err;
      }
    } else {
      console.warn("MP_WEBHOOK_SECRET no configurado: no se esta validando el origen de las notificaciones de Mercado Pago");
    }

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
      include: {
        items: {
          include: {
            product: {
              include: { images: { orderBy: { isPrimary: "desc" }, take: 1 } },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ received: true });
    }

    // Pago aprobado
    if (status === "approved" && order.status === "PENDING") {
      const oversoldItems: string[] = [];

      await prisma.$transaction(async (tx) => {
        // Descontar stock de forma atomica (evita que dos pagos aprobados
        // en simultaneo para el mismo talle dejen el stock negativo o
        // vendan de mas). Si no alcanza el stock, no se bloquea el pago
        // (la plata ya fue cobrada por MP) pero se deja registrado para
        // revisar a mano.
        for (const item of order.items) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
          });
          if (!variant) continue;

          const result = await tx.productVariant.updateMany({
            where: { id: item.variantId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });

          if (result.count === 0) {
            oversoldItems.push(item.productName + " (talle " + item.size + ")");
            await tx.stockMovement.create({
              data: {
                variantId: item.variantId,
                type: "PURCHASE",
                quantity: 0,
                previousStock: variant.stock,
                newStock: variant.stock,
                orderId: order.id,
                createdBy: "webhook:mercadopago",
                note: "Pago aprobado sin stock suficiente al momento de confirmarse — revisar a mano",
              },
            });
            continue;
          }

          await tx.stockMovement.create({
            data: {
              variantId: item.variantId,
              type: "PURCHASE",
              quantity: -item.quantity,
              previousStock: variant.stock,
              newStock: variant.stock - item.quantity,
              orderId: order.id,
              createdBy: "webhook:mercadopago",
            },
          });
        }

        // Actualizar orden
        await tx.order.update({
          where: { id: orderId },
          data: {
            status: "PAID",
            paymentId: String(paymentId),
            paymentStatus: status,
            ...(oversoldItems.length > 0 && {
              notes:
                (order.notes ? order.notes + "\n" : "") +
                "⚠ Sin stock suficiente al confirmarse el pago: " +
                oversoldItems.join(", ") +
                ". Puede requerir reembolso parcial o contactar al cliente.",
            }),
          },
        });

        // Incrementar uso del cupon
        if (order.couponId) {
          await tx.coupon.update({
            where: { id: order.couponId },
            data: { usedCount: { increment: 1 } },
          });
        }
      });

      console.log("Pago aprobado — Orden:", order.orderNumber, oversoldItems.length > 0 ? "(CON SOBREVENTA)" : "");

      // Email de confirmacion — si falla el envio no queremos que MP
      // reintente el webhook entero (el pago ya quedo bien procesado),
      // asi que el error queda solo logueado.
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
            receiptUrl: baseUrl + "/receipt/" + order.id,
          });
        } catch (emailError) {
          console.error("No se pudo enviar el email de confirmacion:", emailError);
        }
      }
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
export const dynamic = "force-dynamic";
