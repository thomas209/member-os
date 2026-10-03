import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { refrescarTienda } from "@/lib/storeCache";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const category = await prisma.category.update({ where: { id: (await params).id }, data: body });
    refrescarTienda();
    return NextResponse.json({ category });
  } catch {
    return NextResponse.json({ error: "Error al actualizar categoria" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
