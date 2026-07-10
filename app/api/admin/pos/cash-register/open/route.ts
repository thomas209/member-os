import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// Abre una sesion de caja con el monto de efectivo inicial.
// Solo puede haber una sesion abierta a la vez.
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const openingAmount = Number(body.openingAmount);

    if (isNaN(openingAmount) || openingAmount < 0) {
      return NextResponse.json({ error: "Monto inicial invalido" }, { status: 400 });
    }

    const existing = await prisma.cashRegisterSession.findFirst({ where: { status: "OPEN" } });
    if (existing) {
      return NextResponse.json({ error: "Ya hay una caja abierta" }, { status: 400 });
    }

    const session = await prisma.cashRegisterSession.create({
      data: {
        openedById: token.id as string,
        openingAmount,
        status: "OPEN",
      },
    });

    return NextResponse.json({ session: { id: session.id } }, { status: 201 });
  } catch (error) {
    console.error("Error abriendo caja:", error);
    return NextResponse.json({ error: "Error al abrir la caja" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
