import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendShippingEmail } from "@/lib/email";

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["PROCESSING", "REFUNDED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, trackingNumber, shippingMethod } = body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    const updateData: any = {};

    if (status && status !== order.status) {
      const validNext = VALID_TRANSITIONS[order.status] || [];
      if (!validNext.includes(status)) {
        return NextResponse.json({
          error: "Transicion invalida: " + order.status + " -> " + status
        }, { status: 400 });
      }
      updateData.status = status;
    }

    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
    if (shippingMethod !== undefined) updateData.shippingMethod = shippingMethod;

    const updated = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    // Enviar el mail de "pedido despachado" justo cuando el pedido pasa a
    // SHIPPED (antes esto dependia de que en ese mismo request tambien se
    // mandara el numero de seguimiento, asi que si el admin apretaba
    // "Despachado" sin haber cargado el tracking en el mismo tiro, no se
    // mandaba nada). Usa el tracking recien cargado o, si no vino en este
    // request, el que ya estuviera guardado en el pedido.
    const trackingToSend = trackingNumber || order.trackingNumber;
    const justShipped = status === "SHIPPED" && order.status !== "SHIPPED";

    let emailSent = false;
    let emailWarning: string | null = null;

    if (justShipped && order.guestEmail && trackingToSend) {
      try {
        await sendShippingEmail({
          to: order.guestEmail,
          firstName: order.guestFirstName || "Cliente",
          orderNumber: order.orderNumber,
          trackingNumber: trackingToSend,
          items: order.items.map((item) => ({
            productName: item.productName,
            productBrand: item.productBrand,
            size: item.size,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            image: item.product.images[0]?.url ?? null,
          })),
          total: Number(order.total),
        });
        emailSent = true;
        console.log("Email enviado a:", order.guestEmail);
      } catch (emailError) {
        emailWarning = "No se pudo enviar el email de despacho al cliente";
        console.error("Error al enviar email:", emailError);
      }
    } else if (justShipped && !trackingToSend) {
      emailWarning = "El pedido se marco como despachado pero no tiene numero de seguimiento, asi que no se le mando el mail al cliente";
      console.warn("Pedido " + order.orderNumber + " pasado a SHIPPED sin numero de seguimiento: no se mando el email de despacho.");
    }

    return NextResponse.json({ order: updated, emailSent, emailWarning });
  } catch (error) {
    console.error("Error actualizando pedido:", error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
