import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Solo lectura: devuelve los datos actuales (precio, talles, stock) de los
// productos guardados en favoritos. No escribe nada en la base.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slugs = (searchParams.get("slugs") || "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[a-z0-9-]+$/i.test(s))
    .slice(0, 40);
  if (slugs.length === 0) return NextResponse.json({ products: [] });

  const products = await prisma.product.findMany({
    where: { slug: { in: slugs }, isActive: true, deletedAt: null },
    select: {
      slug: true,
      name: true,
      price: true,
      comparePrice: true,
      isEncargo: true,
      brand: { select: { name: true } },
      images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1, select: { url: true } },
      variants: { orderBy: { sortOrder: "asc" }, select: { size: true, stock: true } },
    },
  });

  return NextResponse.json({
    products: products.map((p) => ({
      slug: p.slug,
      name: p.name,
      brand: p.brand.name,
      price: Number(p.price),
      comparePrice: p.comparePrice ? Number(p.comparePrice) : null,
      isEncargo: p.isEncargo,
      image: p.images[0]?.url ?? null,
      sizes: p.variants.map((v) => ({ size: v.size, stock: v.stock })),
    })),
  });
}
