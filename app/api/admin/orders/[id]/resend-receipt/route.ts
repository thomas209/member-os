import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmail } from "@/lib/email";

// Reenvia el mail de comprobante de un pedido ya existente (online o POS).
// Usa la misma plantilla que la confirmacion original — se usa cuando el
// cliente no lo recibio, lo perdio, o el vendedor quiere volver a mandarlo
// a mano desde la vista de "Pedidos".
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
    if (!order.guestEmail) {
      return NextResponse.json({ error: "Este pedido no tiene email cargado" }, { status: 400 });
    }

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

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error reenviando comprobante:", error);
    return NextResponse.json({ error: "No se pudo reenviar el mail" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
