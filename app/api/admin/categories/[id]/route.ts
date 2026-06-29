import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const category = await prisma.category.update({ where: { id: (await params).id }, data: body });
    return NextResponse.json({ category });
  } catch {
    return NextResponse.json({ error: "Error al actualizar categoria" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
export const dynamic = "force-dynamic";
