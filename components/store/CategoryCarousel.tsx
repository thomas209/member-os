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
      images: { where: { isPrimary: true }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
  return products;
}

export default async function CategoryCarousel({
  title,
  categorySlug,
}: {
  title: string;
  categorySlug: string;
}) {
  const products = await getProductsByCategory(categorySlug);

  if (products.length === 0) return null;

  return (
    <section className="bg-white px-4 py-12 md:px-12 md:py-20">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex justify-between items-baseline mb-8 pb-4 border-b border-neutral-200">
          <h2 className="text-[13px] font-semibold tracking-widest uppercase">{title}</h2>
          <a href={"/catalog?category=" + categorySlug} className="text-[12px] text-neutral-400 no-underline">Ver todo</a>
        </div>
        <CategoryCarouselClient products={products.map(p => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          brand: p.brand.name,
          price: Number(p.price),
          comparePrice: p.comparePrice ? Number(p.comparePrice) : null,
          image: p.images[0]?.url ?? null,
        }))} />
      </div>
    </section>
  );
}
