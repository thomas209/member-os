import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// Cierra la sesion de caja abierta: compara el efectivo contado a mano
// contra lo esperado (apertura + ventas en efectivo de la sesion).
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId } = body;
    const counted = Number(body.closingAmountCounted);

    if (!sessionId || isNaN(counted) || counted < 0) {
      return NextResponse.json({ error: "Faltan datos para cerrar la caja" }, { status: 400 });
    }

    const session = await prisma.cashRegisterSession.findUnique({ where: { id: sessionId } });
    if (!session || session.status !== "OPEN") {
      return NextResponse.json({ error: "No se encontro una caja abierta con ese id" }, { status: 400 });
    }

    const byMethod = await prisma.order.groupBy({
      by: ["paymentMethod"],
      where: { cashRegisterSessionId: session.id, status: { not: "CANCELLED" } },
      _sum: { total: true },
    });

    let cashSales = 0;
    for (const g of byMethod) {
      if ((g.paymentMethod || "EFECTIVO") === "EFECTIVO") cashSales += Number(g._sum.total ?? 0);
    }

    const expectedCash = Number(session.openingAmount) + cashSales;
    const difference = counted - expectedCash;

    const updated = await prisma.cashRegisterSession.update({
      where: { id: session.id },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
        closingAmountCounted: counted,
      },
    });

    return NextResponse.json({
      session: { id: updated.id },
      expectedCash,
      counted,
      difference,
    });
  } catch (error) {
    console.error("Error cerrando caja:", error);
    return NextResponse.json({ error: "Error al cerrar la caja" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
