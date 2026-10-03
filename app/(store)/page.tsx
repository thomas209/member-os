// La home se guarda armada y se refresca sola cada 2 minutos (y al guardar
// un producto en el admin). Asi responde al instante en vez de consultar la
// base en cada visita.
export const revalidate = 120;
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import BrandCarousel from "@/components/store/BrandCarousel";
import CategoryCarousel from "@/components/store/CategoryCarousel";
import InstagramSection from "@/components/store/InstagramSection";
import EncargosSection from "@/components/store/EncargosSection";
import HeroSplit from "@/components/store/HeroSplit";
import ProductCard from "@/components/store/ProductCard";

async function getBrands() {
  return await prisma.brand.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, logoUrl: true },
  });
}

async function getEncargos() {
  const products = await prisma.product.findMany({
    where: { isActive: true, deletedAt: null, isEncargo: true },
    include: {
      brand: { select: { name: true } },
      images: { where: { isPrimary: true }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
  return products.map((p) => ({ ...p, price: Number(p.price) }));
}

async function getFeaturedProducts() {
  const products = await prisma.product.findMany({
    where: { isActive: true, deletedAt: null, isFeatured: true },
    include: {
      brand: { select: { name: true } },
      images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 2 },
      variants: { select: { size: true, stock: true }, orderBy: { sortOrder: "asc" } },
    },
    orderBy: { createdAt: "desc" },
    take: 4,
  });
  return products;
}

export default async function HomePage() {
  const [featured, encargos, brands] = await Promise.all([getFeaturedProducts(), getEncargos(), getBrands()]);

  return (
    <main>
      <HeroSplit />

            <BrandCarousel brands={brands} />

      <EncargosSection products={encargos} />

      {/* DESTACADOS */}
      <section className="bg-white sec">
        <div className="sec-in">
          <div className="flex justify-between items-baseline border-b border-neutral-200 overflow-hidden sec-head-linea">
            <h2 className="text-[13px] font-semibold tracking-widest uppercase">Destacados</h2>
            <Link href="/catalog" className="text-[12px] text-neutral-400 no-underline hover:text-neutral-900 transition-colors">Ver todo</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {featured.map((product) => (
              <ProductCard
                key={product.id}
                href={"/product/" + product.slug}
                image={product.images[0]?.url ?? null}
                secondImage={product.images[1]?.url ?? null}
                brand={product.brand.name}
                name={product.name}
                price={product.price.toString()}
                comparePrice={product.comparePrice?.toString()}
                inStock={product.variants.some((v) => v.stock > 0)}
                isEncargo={product.isEncargo}
                sizes={product.variants.map((v) => ({ size: v.size, stock: v.stock }))}
              />
            ))}
          </div>
        </div>
      </section>


      <CategoryCarousel title="Zapatillas" categorySlug="zapatillas" rows={2} />
      <CategoryCarousel title="Ropa" categorySlug="ropa" />
      <CategoryCarousel title="Accesorios" categorySlug="accesorios" />
      <InstagramSection />
    </main>
  );
}
