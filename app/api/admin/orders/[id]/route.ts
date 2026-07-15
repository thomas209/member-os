import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendShippingEmail } from "@/lib/email";

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["PROCESSING", "REFUNDED"],
  PROCESSING: ["CANCELLED"], // SHIPPED sale por la rama de itemIds, no por acá
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, trackingNumber, shippingMethod, itemIds } = body;

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

    // Despacho por item: se manda una lista de items (puede ser todos o
    // una parte, ej: lo que hay en stock ya, el encargo despues) mas un
    // numero de seguimiento para esa tanda. Reemplaza al viejo "marcar
    // todo el pedido como SHIPPED" — ver OrderActions.tsx.
    if (Array.isArray(itemIds) && itemIds.length > 0) {
      if (order.status !== "PROCESSING") {
        return NextResponse.json({ error: "Solo se puede despachar un pedido en proceso" }, { status: 400 });
      }
      if (!trackingNumber || !String(trackingNumber).trim()) {
        return NextResponse.json({ error: "Cargá un número de seguimiento" }, { status: 400 });
      }

      const idsToShip = order.items
        .filter((item) => itemIds.includes(item.id) && !item.shippedAt)
        .map((item) => item.id);

      if (idsToShip.length === 0) {
        return NextResponse.json({ error: "Esos productos ya estaban despachados" }, { status: 400 });
      }

      const shippedAt = new Date();
      await prisma.orderItem.updateMany({
        where: { id: { in: idsToShip } },
        data: { trackingNumber: String(trackingNumber).trim(), shippedAt },
      });

      const allShipped = order.items.every((item) => idsToShip.includes(item.id) || item.shippedAt);

      const updated = await prisma.order.update({
        where: { id },
        data: {
          trackingNumber: String(trackingNumber).trim(),
          ...(allShipped && { status: "SHIPPED" }),
        },
      });

      let emailSent = false;
      let emailWarning: string | null = null;

      if (order.guestEmail) {
        try {
          await sendShippingEmail({
            to: order.guestEmail,
            firstName: order.guestFirstName || "Cliente",
            orderNumber: order.orderNumber,
            trackingNumber: String(trackingNumber).trim(),
            items: order.items
              .filter((item) => idsToShip.includes(item.id))
              .map((item) => ({
                productName: item.productName,
                productBrand: item.productBrand,
                size: item.size,
                quantity: item.quantity,
                unitPrice: Number(item.unitPrice),
                image: item.product.images[0]?.url ?? null,
                isEncargo: item.isEncargo,
              })),
            total: Number(order.total),
            partial: !allShipped,
          });
          emailSent = true;
        } catch (emailError) {
          emailWarning = "No se pudo enviar el email de despacho al cliente";
          console.error("Error al enviar email:", emailError);
        }
      } else {
        emailWarning = "El pedido no tiene email cargado, no se pudo avisar al cliente";
      }

      return NextResponse.json({ order: updated, allShipped, emailSent, emailWarning });
    }

    const updateData: any = {};

    if (status && status !== order.status) {
      if (status === "SHIPPED") {
        return NextResponse.json({ error: "Para despachar seleccioná los productos a despachar" }, { status: 400 });
      }
      const validNext = VALID_TRANSITIONS[order.status] || [];
      if (!validNext.includes(status)) {
        return NextResponse.json({
          error: "Transicion invalida: " + order.status + " -> " + status
        }, { status: 400 });
      }
      updateData.status = status;
    }

    if (shippingMethod !== undefined) updateData.shippingMethod = shippingMethod;

    const updated = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ order: updated });
  } catch (error) {
    console.error("Error actualizando pedido:", error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
