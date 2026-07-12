import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import ProductCard from "@/components/store/ProductCard";
import CatalogToolbar from "@/components/store/CatalogToolbar";

const PAGE_SIZE = 24;

const SORT_OPTIONS: Record<string, { createdAt?: "asc" | "desc"; price?: "asc" | "desc" }> = {
  newest: { createdAt: "desc" },
  price_asc: { price: "asc" },
  price_desc: { price: "desc" },
};

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ category?: string; brand?: string; gender?: string; q?: string; sort?: string; page?: string; encargo?: string }> }) {
  const { category, brand, gender, q, sort, page: pageParam, encargo } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const orderBy = SORT_OPTIONS[sort || "newest"] || SORT_OPTIONS.newest;

  const where = {
    isActive: true,
    deletedAt: null,
    ...(encargo === "1" && { isEncargo: true }),
    ...(category && { category: { slug: category } }),
    ...(brand && { brand: { slug: brand } }),
    ...(gender && { gender: gender as any }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" as const } },
        { brand: { name: { contains: q, mode: "insensitive" as const } } },
      ],
    }),
  };

  const [products, totalCount, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        brand: { select: { name: true, slug: true } },
        category: { select: { name: true, slug: true } },
        images: { orderBy: { isPrimary: "desc" }, take: 1 },
        variants: { select: { stock: true } },
      },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
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

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const buildUrl = (params: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    if (params.category) p.set("category", String(params.category));
    if (params.brand) p.set("brand", String(params.brand));
    if (params.gender) p.set("gender", String(params.gender));
    if (params.q) p.set("q", String(params.q));
    if (params.sort && params.sort !== "newest") p.set("sort", String(params.sort));
    if (params.page && Number(params.page) > 1) p.set("page", String(params.page));
    if (params.encargo) p.set("encargo", String(params.encargo));
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
            {encargo === "1" ? "Encargos" : "Catalogo"} <span style={{color:"#A3A3A3",fontWeight:"400"}}>({totalCount})</span>
          </h1>
        </div>

        <CatalogToolbar category={category} brand={brand} gender={gender} q={q} sort={sort} encargo={encargo} />

        {/* Filtros genero */}
        <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"12px"}}>
          <a href={buildUrl({ category, brand, q, sort, encargo })} style={!gender ? activeStyle : inactiveStyle}>Todos</a>
          <a href={buildUrl({ category, brand, q, sort, encargo, gender: "HOMBRE" })} style={gender === "HOMBRE" ? activeStyle : inactiveStyle}>Hombre</a>
          <a href={buildUrl({ category, brand, q, sort, encargo, gender: "MUJER" })} style={gender === "MUJER" ? activeStyle : inactiveStyle}>Mujer</a>
          <a href={buildUrl({ category, brand, q, sort, encargo, gender: "UNISEX" })} style={gender === "UNISEX" ? activeStyle : inactiveStyle}>Unisex</a>
        </div>

        {/* Filtros categoria */}
        <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"12px"}}>
          <a href={buildUrl({ brand, gender, q, sort, encargo })} style={!category ? activeStyle : inactiveStyle}>Todas las categorias</a>
          {categories.map((cat) => (
            <a key={cat.id} href={buildUrl({ category: cat.slug, brand, gender, q, sort, encargo })} style={category === cat.slug ? activeStyle : inactiveStyle}>
              {cat.name}
            </a>
          ))}
        </div>

        {/* Filtros marca */}
        <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
          <a href={buildUrl({ category, gender, q, sort, encargo })} style={!brand ? activeStyle : inactiveStyle}>Todas las marcas</a>
          {brands.map((b) => (
            <a key={b.id} href={buildUrl({ category, brand: b.slug, gender, q, sort, encargo })} style={brand === b.slug ? activeStyle : inactiveStyle}>
              {b.name}
            </a>
          ))}
        </div>
      </div>

      {/* GRID */}
      {products.length === 0 ? (
        <div style={{textAlign:"center",padding:"80px 0"}}>
          <p style={{fontSize:"14px",color:"#737373"}}>
            {q ? "No encontramos productos para \"" + q + "\"." : "No hay productos en esta categoria."}
          </p>
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
              inStock={product.variants.some((v) => v.stock > 0)}
            />
          ))}
        </div>
      )}

      {/* PAGINACION */}
      {totalPages > 1 && (
        <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:"8px",marginTop:"48px"}}>
          <a
            href={page > 1 ? buildUrl({ category, brand, gender, q, sort, encargo, page: page - 1 }) : undefined}
            aria-disabled={page <= 1}
            style={{...inactiveStyle, opacity: page <= 1 ? 0.4 : 1, pointerEvents: page <= 1 ? "none" : "auto"}}
          >
            Anterior
          </a>
          <span style={{fontSize:"12px",color:"#737373",padding:"0 8px"}}>
            Página {page} de {totalPages}
          </span>
          <a
            href={page < totalPages ? buildUrl({ category, brand, gender, q, sort, encargo, page: page + 1 }) : undefined}
            aria-disabled={page >= totalPages}
            style={{...inactiveStyle, opacity: page >= totalPages ? 0.4 : 1, pointerEvents: page >= totalPages ? "none" : "auto"}}
          >
            Siguiente
          </a>
        </div>
      )}
    </div>
  );
}
