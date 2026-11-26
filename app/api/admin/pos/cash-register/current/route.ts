import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { breakdown } from "@/lib/payment-split";

// Devuelve la sesion de caja abierta (si hay una) junto con los totales
// vendidos en esa sesion, desglosados por metodo de pago.
export async function GET() {
  try {
    const session = await prisma.cashRegisterSession.findFirst({
      where: { status: "OPEN" },
      orderBy: { openedAt: "desc" },
      include: { openedBy: { select: { firstName: true, lastName: true } } },
    });

    if (!session) {
      return NextResponse.json({ session: null });
    }

    // Una venta con pago dividido suma cada parte en su medio.
    const orders = await prisma.order.findMany({
      where: { cashRegisterSessionId: session.id, status: { not: "CANCELLED" } },
      select: { paymentMethod: true, paymentSplit: true, total: true },
    });

    const totals: Record<string, number> = { EFECTIVO: 0, TARJETA: 0, TRANSFERENCIA: 0 };
    for (const o of orders) {
      const b = breakdown(o.paymentMethod, o.paymentSplit, Number(o.total));
      totals.EFECTIVO += b.EFECTIVO;
      totals.TARJETA += b.TARJETA;
      totals.TRANSFERENCIA += b.TRANSFERENCIA;
    }
    const orderCount = orders.length;

    const expectedCash = Number(session.openingAmount) + totals.EFECTIVO;

    return NextResponse.json({
      session: {
        id: session.id,
        openingAmount: Number(session.openingAmount),
        openedAt: session.openedAt,
        openedByName: session.openedBy.firstName + " " + session.openedBy.lastName,
      },
      totals,
      orderCount,
      expectedCash,
    });
  } catch (error) {
    console.error("Error obteniendo caja:", error);
    return NextResponse.json({ error: "Error al obtener la caja" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
