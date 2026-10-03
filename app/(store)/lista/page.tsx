import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { parseLista } from "@/store/favorites";

export const dynamic = "force-dynamic";

type Params = { de?: string; p?: string };

function nombreDe(de: string | undefined) {
  const limpio = (de || "").replace(/[<>]/g, "").trim().slice(0, 24);
  return limpio ? "La selección de " + limpio : "Una selección de Member Club";
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }): Promise<Metadata> {
  const sp = await searchParams;
  const favs = parseLista(sp.p);
  const titulo = nombreDe(sp.de);
  const descripcion = favs.length + (favs.length === 1 ? " producto guardado" : " productos guardados") + ", con sus talles.";
  // La portada se arma con el mismo host desde el que se abre el link, asi
  // tambien funciona en los previews.
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "www.memberclubargentina.com";
  const proto = host.startsWith("localhost") ? "http" : "https";
  const og = proto + "://" + host + "/api/og/lista?" + new URLSearchParams({ de: sp.de || "", p: sp.p || "" }).toString();
  return {
    title: titulo + " · Member Club",
    description: descripcion,
    robots: { index: false, follow: false },
    openGraph: { title: titulo + " · Member Club", description: descripcion, images: [{ url: og, width: 1200, height: 1200 }] },
  };
}

export default async function ListaPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const favs = parseLista(sp.p);
  const products = favs.length
    ? await prisma.product.findMany({
        where: { slug: { in: favs.map((f) => f.slug) }, isActive: true, deletedAt: null },
        select: {
          slug: true, name: true, price: true,
          brand: { select: { name: true } },
          images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1, select: { url: true } },
        },
      })
    : [];
  const filas = favs
    .map((f) => ({ fav: f, product: products.find((p) => p.slug === f.slug) }))
    .filter((x) => !!x.product);

  return (
    <div className="fav-page">
      <header className="fav-head fav-head-centro fav-in">
        <p className="fav-rotulo fav-rotulo-rojo">Lista de regalos</p>
        <h1 className="fav-h1">{nombreDe(sp.de)}</h1>
        <p className="fav-sub">Esto es lo que eligió, con el talle de cada cosa. Tocá un producto para comprarlo.</p>
      </header>

      {filas.length === 0 ? (
        <div className="fav-vacio-box">
          <p className="fav-vacio">Esta lista está vacía o los productos ya no están disponibles.</p>
          <Link href="/catalog" className="fav-pastilla">Ver el catálogo</Link>
        </div>
      ) : (
        <div className="fav-grid">
          {filas.map(({ fav, product }, i) => (
            <Link key={product!.slug} href={"/product/" + product!.slug} className="fav-card fav-in" style={{ animationDelay: i * 70 + "ms" }}>
              <div className="fav-card-foto">
                {product!.images[0]?.url && <img src={product!.images[0].url} alt={product!.name} loading="lazy" />}
                {fav.size && <span className="fav-talle-tag">Talle {fav.size}</span>}
              </div>
              <span className="fav-marca">{product!.brand.name}</span>
              <span className="nombre-producto fav-nombre">{product!.name}</span>
              <span className="precio fav-precio">${Number(product!.price).toLocaleString("es-AR")}</span>
            </Link>
          ))}
        </div>
      )}

      <div className="fav-acciones fav-acciones-centro">
        <Link href="/catalog" className="fav-link">Ver todo el catálogo</Link>
      </div>
    </div>
  );
}
