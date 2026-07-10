import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const byMethod = await prisma.order.groupBy({
      by: ["paymentMethod"],
      where: { cashRegisterSessionId: session.id, status: { not: "CANCELLED" } },
      _sum: { total: true },
      _count: true,
    });

    const totals: Record<string, number> = { EFECTIVO: 0, TARJETA: 0, TRANSFERENCIA: 0 };
    let orderCount = 0;
    for (const g of byMethod) {
      const method = g.paymentMethod || "EFECTIVO";
      if (method in totals) totals[method] += Number(g._sum.total ?? 0);
      orderCount += g._count;
    }

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
