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

    // Enviar email si se cargo el numero de seguimiento
    if (trackingNumber && order.guestEmail) {
      try {
        await sendShippingEmail({
          to: order.guestEmail,
          firstName: order.guestFirstName || "Cliente",
          orderNumber: order.orderNumber,
          trackingNumber,
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
        console.log("Email enviado a:", order.guestEmail);
      } catch (emailError) {
        console.error("Error al enviar email:", emailError);
      }
    }

    return NextResponse.json({ order: updated });
  } catch (error) {
    console.error("Error actualizando pedido:", error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
