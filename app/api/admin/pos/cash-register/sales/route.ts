import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Historial de ventas de la sesion de caja abierta (o de una sesion
// puntual si se pasa sessionId), para el panel "Ventas de hoy" del POS.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      const open = await prisma.cashRegisterSession.findFirst({ where: { status: "OPEN" } });
      if (!open) {
        return NextResponse.json({ orders: [] });
      }
      sessionId = open.id;
    }

    const orders = await prisma.order.findMany({
      where: { cashRegisterSessionId: sessionId },
      orderBy: { createdAt: "desc" },
      include: { items: { select: { quantity: true } } },
    });

    return NextResponse.json({
      // Se listan todas, incluidas las anuladas (para que quede el registro visible),
      // pero el status permite al frontend excluirlas de los totales en pesos.
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        createdAt: o.createdAt,
        paymentMethod: o.paymentMethod,
        total: Number(o.total),
        discountAmount: Number(o.discountAmount),
        itemCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
        status: o.status,
      })),
    });
  } catch (error) {
    console.error("Error obteniendo ventas del turno:", error);
    return NextResponse.json({ error: "Error al obtener las ventas" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
