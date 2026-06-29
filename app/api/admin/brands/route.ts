import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const brands = await prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  return NextResponse.json({ brands });
}

export async function POST(request: Request) {
  try {
    const { name, slug } = await request.json();
    if (!name || !slug) return NextResponse.json({ error: "Nombre y slug requeridos" }, { status: 400 });
    const brand = await prisma.brand.create({ data: { name, slug } });
    return NextResponse.json({ brand }, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") return NextResponse.json({ error: "Ya existe una marca con ese nombre o slug" }, { status: 400 });
    return NextResponse.json({ error: "Error al crear marca" }, { status: 500 });
  }
}
