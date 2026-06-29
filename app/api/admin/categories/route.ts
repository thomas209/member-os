import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  try {
    const { name, slug } = await request.json();
    if (!name || !slug) return NextResponse.json({ error: "Nombre y slug requeridos" }, { status: 400 });
    const category = await prisma.category.create({ data: { name, slug } });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") return NextResponse.json({ error: "Ya existe una categoria con ese nombre o slug" }, { status: 400 });
    return NextResponse.json({ error: "Error al crear categoria" }, { status: 500 });
  }
}
