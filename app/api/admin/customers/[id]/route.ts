import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// Edita las notas y tags internos de un cliente (uso exclusivo del admin,
// el cliente nunca ve esto). Protegido por el middleware (/api/admin/:path*).
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const data: { notes?: string; tags?: string[] } = {};
    if (typeof body.notes === "string") data.notes = body.notes;
    if (Array.isArray(body.tags)) {
      data.tags = body.tags.map((t: unknown) => String(t).trim()).filter(Boolean);
    }

    const customer = await prisma.customer.update({ where: { id }, data });
    return NextResponse.json({ ok: true, customer });
  } catch (error) {
    console.error("Error al actualizar cliente:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
