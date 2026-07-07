export const revalidate = 0;
import { prisma } from "@/lib/prisma";
import BrandCarousel from "@/components/store/BrandCarousel";
import CategoryCarousel from "@/components/store/CategoryCarousel";
import InstagramSection from "@/components/store/InstagramSection";
import EncargosSection from "@/components/store/EncargosSection";
import HeroSplit from "@/components/store/HeroSplit";

async function getBrands() {
  return await prisma.brand.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, logoUrl: true },
  });
}

async function getFeaturedProducts() {
  const products = await prisma.product.findMany({
    where: { isActive: true, deletedAt: null, isFeatured: true },
    include: {
      brand: { select: { name: true } },
      images: { where: { isPrimary: true }, take: 1 },
      variants: { select: { stock: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 4,
  });
  return products;
}

export default async function HomePage() {
  const featured = await getFeaturedProducts();
  const brands = await getBrands();

  return (
    <main>
      <HeroSplit />

            <BrandCarousel brands={brands} />

      <EncargosSection />

      {/* DESTACADOS */}
      <section className="bg-white px-4 py-12 md:px-12 md:py-20">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex justify-between items-baseline mb-8 pb-4 border-b border-neutral-200 overflow-hidden">
            <h2 className="text-[13px] font-semibold tracking-widest uppercase">Destacados</h2>
            <a href="/catalog" className="text-[12px] text-neutral-400 no-underline">Ver todo</a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-[2px]">
            {featured.map((product) => (
              <a key={product.id} href={"/product/" + product.slug} className="no-underline text-[#0A0A0A] block">
                <div className="aspect-[4/5] bg-neutral-100 mb-3 overflow-hidden">
                  {product.images[0] ? (
                    <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
                      <span className="text-[11px] text-neutral-400 tracking-wider">SIN IMAGEN</span>
                    </div>
                  )}
                </div>
                <div className="pb-6">
                  <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-1">{product.brand.name}</p>
                  <p className="text-[13px] md:text-[15px] font-medium mb-1">{product.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] md:text-[15px] font-bold">${Number(product.price).toLocaleString("es-AR")}</p>
                    {product.comparePrice && (
                      <p className="text-[12px] text-neutral-400 line-through">${Number(product.comparePrice).toLocaleString("es-AR")}</p>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>


      <CategoryCarousel title="Zapatillas" categorySlug="zapatillas" />
      <CategoryCarousel title="Ropa" categorySlug="ropa" />
      <InstagramSection />
    </main>
  );
}
