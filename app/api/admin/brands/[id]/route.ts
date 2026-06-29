import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const brand = await prisma.brand.update({ where: { id: params.id }, data: body });
    return NextResponse.json({ brand });
  } catch {
    return NextResponse.json({ error: "Error al actualizar marca" }, { status: 500 });
  }
}
