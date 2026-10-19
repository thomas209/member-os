import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { socialDisabled } from "@/lib/ai/http";

// Buscador de productos para armar posts. Solo lectura.
export async function GET(request: NextRequest) {
  const off = socialDisabled();
  if (off) return off;
  const q = (request.nextUrl.searchParams.get("q") || "").trim();
  const products = await prisma.product.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { brand: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      brand: { select: { name: true } },
      images: { select: { url: true }, orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
      variants: { where: { stock: { gt: 0 } }, select: { size: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });
  return NextResponse.json({
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      brand: p.brand.name,
      image: p.images[0]?.url || null,
      imageCount: p.images.length,
      sizes: p.variants.map((v) => v.size),
    })),
  });
}
