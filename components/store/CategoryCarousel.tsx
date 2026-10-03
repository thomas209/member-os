import CategoryCarouselClient from "@/components/store/CategoryCarouselClient";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  brand: { name: string };
  images: { url: string }[];
};

async function getProductsByCategory(categorySlug: string, take = 16) {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      category: { slug: categorySlug },
    },
    include: {
      brand: { select: { name: true } },
      images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 2 },
      variants: { select: { size: true, stock: true }, orderBy: { sortOrder: "asc" } },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
  return products;
}

export default async function CategoryCarousel({
  title,
  categorySlug,
  rows,
}: {
  title: string;
  categorySlug: string;
  rows?: 1 | 2;
}) {
  const products = await getProductsByCategory(categorySlug);

  if (products.length === 0) return null;

  return (
    <section className="bg-white sec sec-carrusel">
      <div className="sec-in">
        <div className="flex justify-between items-baseline sec-head">
          <h2 className="text-[13px] font-semibold tracking-widest uppercase">{title}</h2>
          <Link href={"/catalog?category=" + categorySlug} className="text-[12px] text-neutral-400 no-underline hover:text-neutral-900 transition-colors">Ver todo</Link>
        </div>
        <CategoryCarouselClient rows={rows} products={products.map(p => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          brand: p.brand.name,
          price: Number(p.price),
          comparePrice: p.comparePrice ? Number(p.comparePrice) : null,
          image: p.images[0]?.url ?? null,
          secondImage: p.images[1]?.url ?? null,
          isEncargo: p.isEncargo,
          sizes: p.variants.map((v) => ({ size: v.size, stock: v.stock })),
        }))} />
      </div>
    </section>
  );
}
