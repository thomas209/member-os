import ProductCard from "@/components/store/ProductCard";

export type RelatedProduct = {
  id: string;
  slug: string;
  image: string | null;
  secondImage: string | null;
  brand: string;
  name: string;
  price: string;
  comparePrice: string | null;
  inStock: boolean;
};

export default function RelatedProducts({ products }: { products: RelatedProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section className="max-w-[1440px] mx-auto px-4 md:px-12 pt-4 pb-16 md:pb-24">
      <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-6">
        También te puede interesar
      </p>

      {/* Mobile — scroll horizontal */}
      <div className="flex md:hidden gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((p) => (
          <div key={p.id} className="shrink-0 w-[62%] snap-start">
            <ProductCard
              href={`/product/${p.slug}`}
              image={p.image}
              secondImage={p.secondImage}
              brand={p.brand}
              name={p.name}
              price={p.price}
              comparePrice={p.comparePrice}
              inStock={p.inStock}
            />
          </div>
        ))}
      </div>

      {/* Desktop — grid */}
      <div className="hidden md:grid grid-cols-4 gap-8">
        {products.slice(0, 4).map((p) => (
          <ProductCard
            key={p.id}
            href={`/product/${p.slug}`}
            image={p.image}
            secondImage={p.secondImage}
            brand={p.brand}
            name={p.name}
            price={p.price}
            comparePrice={p.comparePrice}
            inStock={p.inStock}
          />
        ))}
      </div>
    </section>
  );
}
