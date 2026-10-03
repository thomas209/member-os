import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { TAG_TIENDA } from "@/lib/storeCache";
import type { Metadata } from "next";
import ProductCard from "@/components/store/ProductCard";
import CatalogToolbar from "@/components/store/CatalogToolbar";

const PAGE_SIZE = 24;

type CatalogSearchParams = {
  category?: string;
  brand?: string;
  gender?: string;
  q?: string;
  sort?: string;
  page?: string;
  encargo?: string;
};

const GENDER_LABEL: Record<string, string> = {
  HOMBRE: "Hombre",
  MUJER: "Mujer",
  UNISEX: "Unisex",
};

export async function generateMetadata({ searchParams }: { searchParams: Promise<CatalogSearchParams> }): Promise<Metadata> {
  const { category, brand, gender, q, encargo } = await searchParams;

  const [categoryRow, brandRow] = await Promise.all([
    category ? prisma.category.findUnique({ where: { slug: category }, select: { name: true } }) : null,
    brand ? prisma.brand.findUnique({ where: { slug: brand }, select: { name: true } }) : null,
  ]);

  const parts = [
    encargo === "1" ? "Encargos" : null,
    brandRow?.name,
    categoryRow?.name,
    gender ? GENDER_LABEL[gender] : null,
    q ? `"${q}"` : null,
  ].filter(Boolean);

  const title = parts.length > 0 ? `${parts.join(" · ")} | Catálogo` : "Catálogo";
  const description =
    parts.length > 0
      ? `Descubrí ${parts.join(", ")} en Member Club. Ropa y zapatillas importadas con envíos a todo el país.`
      : "Catálogo de Member Club: ropa y zapatillas importadas de Nike, Adidas, On Running, Hoka, Supreme y más. Envíos a todo el país.";

  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: "summary", title, description },
  };
}

const SORT_OPTIONS: Record<string, { createdAt?: "asc" | "desc"; price?: "asc" | "desc" }> = {
  newest: { createdAt: "desc" },
  price_asc: { price: "asc" },
  price_desc: { price: "desc" },
};

// Listado del catalogo, guardado 1 minuto por combinacion de filtros. Asi el
// cambio entre secciones (Hombre, Mujer, Arte...) responde al instante en vez
// de consultar la base cada vez. Se refresca solo al guardar un producto en
// el admin. El stock real se vuelve a validar siempre en el checkout.
const getCatalogo = unstable_cache(
  async (clave: string) => {
    const { category, brand, gender, q, sort, page, encargo } = JSON.parse(clave) as CatalogSearchParams & { page: number };
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
    const [rows, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          brand: { select: { name: true } },
          images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 2, select: { url: true } },
          variants: { select: { size: true, stock: true }, orderBy: { sortOrder: "asc" } },
        },
        orderBy,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.product.count({ where }),
    ]);
    // Datos simples (sin Decimal ni fechas) para poder guardarlos en cache
    const products = rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price.toString(),
      comparePrice: p.comparePrice ? p.comparePrice.toString() : null,
      isEncargo: p.isEncargo,
      brand: { name: p.brand.name },
      images: p.images.map((i) => ({ url: i.url })),
      variants: p.variants.map((v) => ({ size: v.size, stock: v.stock })),
    }));
    return { products, totalCount };
  },
  ["catalogo-v1"],
  { revalidate: 60, tags: [TAG_TIENDA] }
);


export default async function CatalogPage({ searchParams }: { searchParams: Promise<CatalogSearchParams> }) {
  const { category, brand, gender, q, sort, page: pageParam, encargo } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const [{ products, totalCount }, categories, brands] = await Promise.all([
    getCatalogo(JSON.stringify({ category, brand, gender, q, sort: sort || "newest", page, encargo })),
    unstable_cache(
      () => prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      ["categories"],
      { revalidate: 300, tags: [TAG_TIENDA] }
    )(),
    unstable_cache(
      () => prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
      ["brands"],
      { revalidate: 300, tags: [TAG_TIENDA] }
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
          <Link href={buildUrl({ category, brand, q, sort, encargo })} className="hover-pill" style={!gender ? activeStyle : inactiveStyle}>Todos</Link>
          <Link href={buildUrl({ category, brand, q, sort, encargo, gender: "HOMBRE" })} className="hover-pill" style={gender === "HOMBRE" ? activeStyle : inactiveStyle}>Hombre</Link>
          <Link href={buildUrl({ category, brand, q, sort, encargo, gender: "MUJER" })} className="hover-pill" style={gender === "MUJER" ? activeStyle : inactiveStyle}>Mujer</Link>
          <Link href={buildUrl({ category, brand, q, sort, encargo, gender: "UNISEX" })} className="hover-pill" style={gender === "UNISEX" ? activeStyle : inactiveStyle}>Unisex</Link>
        </div>

        {/* Filtros categoria */}
        <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"12px"}}>
          <Link href={buildUrl({ brand, gender, q, sort, encargo })} className="hover-pill" style={!category ? activeStyle : inactiveStyle}>Todas las categorias</Link>
          {categories.map((cat) => (
            <Link key={cat.id} href={buildUrl({ category: cat.slug, brand, gender, q, sort, encargo })} className="hover-pill" style={category === cat.slug ? activeStyle : inactiveStyle}>
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Filtros marca */}
        <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
          <Link href={buildUrl({ category, gender, q, sort, encargo })} className="hover-pill" style={!brand ? activeStyle : inactiveStyle}>Todas las marcas</Link>
          {brands.map((b) => (
            <Link key={b.id} href={buildUrl({ category, brand: b.slug, gender, q, sort, encargo })} className="hover-pill" style={brand === b.slug ? activeStyle : inactiveStyle}>
              {b.name}
            </Link>
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
        <div key={[category, brand, gender, q, sort, page, encargo].join("|")} className="catalog-grid catalog-in">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              href={"/product/" + product.slug}
              image={product.images[0]?.url ?? null}
              secondImage={product.images[1]?.url ?? null}
              brand={product.brand.name}
              name={product.name}
              price={product.price}
              comparePrice={product.comparePrice}
              inStock={product.variants.some((v) => v.stock > 0)}
              isEncargo={product.isEncargo}
              sizes={product.variants.map((v) => ({ size: v.size, stock: v.stock }))}
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
            className="hover-pill"
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
            className="hover-pill"
            style={{...inactiveStyle, opacity: page >= totalPages ? 0.4 : 1, pointerEvents: page >= totalPages ? "none" : "auto"}}
          >
            Siguiente
          </a>
        </div>
      )}
    </div>
  );
}
