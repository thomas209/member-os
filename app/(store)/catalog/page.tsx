import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import ProductCard from "@/components/store/ProductCard";

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ category?: string; brand?: string; gender?: string }> }) {
  const { category, brand, gender } = await searchParams;

  const [products, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        ...(category && { category: { slug: category } }),
        ...(brand && { brand: { slug: brand } }),
        ...(gender && { gender: gender as any }),
      },
      include: {
        brand: { select: { name: true, slug: true } },
        category: { select: { name: true, slug: true } },
        images: { orderBy: { isPrimary: "desc" }, take: 1 },
        variants: { select: { stock: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    unstable_cache(
      () => prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      ["categories"],
      { revalidate: 300 }
    )(),
    unstable_cache(
      () => prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
      ["brands"],
      { revalidate: 300 }
    )(),
  ]);

  const buildUrl = (params: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    if (params.category) p.set("category", params.category);
    if (params.brand) p.set("brand", params.brand);
    if (params.gender) p.set("gender", params.gender);
    return "/catalog" + (p.toString() ? "?" + p.toString() : "");
  };

  const activeStyle = {
    fontSize:"12px", fontWeight:"600", letterSpacing:"0.06em",
    textDecoration:"none", padding:"8px 16px",
    backgroundColor:"#0A0A0A", color:"white",
    border:"1px solid #0A0A0A",
  };

  const inactiveStyle = {
    fontSize:"12px", fontWeight:"400", letterSpacing:"0.06em",
    textDecoration:"none", padding:"8px 16px",
    backgroundColor:"white", color:"#737373",
    border:"1px solid #E8E8E8",
  };

  return (
    <div style={{maxWidth:"1440px",margin:"0 auto",padding:"48px"}}>

      {/* HEADER + FILTROS */}
      <div style={{marginBottom:"48px",paddingBottom:"24px",borderBottom:"1px solid #E8E8E8"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:"24px"}}>
          <h1 style={{fontSize:"13px",fontWeight:"600",letterSpacing:"0.12em",textTransform:"uppercase"}}>
            Catalogo <span style={{color:"#A3A3A3",fontWeight:"400"}}>({products.length})</span>
          </h1>
        </div>

        {/* Filtros genero */}
        <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"12px"}}>
          <a href={buildUrl({ category, brand })} style={!gender ? activeStyle : inactiveStyle}>Todos</a>
          <a href={buildUrl({ category, brand, gender: "HOMBRE" })} style={gender === "HOMBRE" ? activeStyle : inactiveStyle}>Hombre</a>
          <a href={buildUrl({ category, brand, gender: "MUJER" })} style={gender === "MUJER" ? activeStyle : inactiveStyle}>Mujer</a>
          <a href={buildUrl({ category, brand, gender: "UNISEX" })} style={gender === "UNISEX" ? activeStyle : inactiveStyle}>Unisex</a>
        </div>

        {/* Filtros categoria */}
        <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"12px"}}>
          <a href={buildUrl({ brand, gender })} style={!category ? activeStyle : inactiveStyle}>Todas las categorias</a>
          {categories.map((cat) => (
            <a key={cat.id} href={buildUrl({ category: cat.slug, brand, gender })} style={category === cat.slug ? activeStyle : inactiveStyle}>
              {cat.name}
            </a>
          ))}
        </div>

        {/* Filtros marca */}
        <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
          <a href={buildUrl({ category, gender })} style={!brand ? activeStyle : inactiveStyle}>Todas las marcas</a>
          {brands.map((b) => (
            <a key={b.id} href={buildUrl({ category, brand: b.slug, gender })} style={brand === b.slug ? activeStyle : inactiveStyle}>
              {b.name}
            </a>
          ))}
        </div>
      </div>

      {/* GRID */}
      {products.length === 0 ? (
        <div style={{textAlign:"center",padding:"80px 0"}}>
          <p style={{fontSize:"14px",color:"#737373"}}>No hay productos en esta categoria.</p>
        </div>
      ) : (
        <div className="catalog-grid">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              href={"/product/" + product.slug}
              image={product.images[0]?.url ?? null}
              brand={product.brand.name}
              name={product.name}
              price={product.price.toString()}
              comparePrice={product.comparePrice?.toString()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
