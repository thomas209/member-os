"use client";
import { useEffect, useMemo, useState } from "react";
import { useFavStore, buildListaPath } from "@/store/favorites";
import { useCartStore } from "@/store/cart";
import { HEART_PATH } from "@/components/store/FavHeart";

type Size = { id: string; size: string; stock: number };
type Item = {
  id: string; slug: string; name: string; brand: string; price: number; comparePrice: number | null;
  isEncargo: boolean; image: string | null; sizes: Size[];
};

// Variante que corresponde a lo guardado: el talle elegido, o la unica que
// hay si el producto es de talle unico.
function variante(item: Item, size: string | null): Size | null {
  if (size) return item.sizes.find((s) => s.size === size) ?? null;
  return item.sizes.length === 1 ? item.sizes[0] : null;
}

function estado(item: Item, size: string | null): { texto: string; tipo: "ok" | "poco" | "no" } {
  const stock = size
    ? item.sizes.find((s) => s.size === size)?.stock ?? 0
    : item.sizes.reduce((a, s) => a + s.stock, 0);
  const enTalle = size ? " en tu talle" : "";
  if (stock <= 0) return item.isEncargo ? { texto: "Por encargo · 14 días", tipo: "no" } : { texto: "Sin stock" + enTalle, tipo: "no" };
  if (stock <= 2) return { texto: (stock === 1 ? "Queda 1" : "Quedan 2") + enTalle, tipo: "poco" };
  return { texto: "Disponible" + enTalle, tipo: "ok" };
}

const ShareIcon = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><path d="m16 6-4-4-4 4" /><path d="M12 2v13" /></svg>
);

export default function FavoritosPage() {
  const favs = useFavStore((s) => s.favs);
  const remove = useFavStore((s) => s.remove);
  const ownerName = useFavStore((s) => s.ownerName);
  const setOwnerName = useFavStore((s) => s.setOwnerName);
  const addItem = useCartStore((s) => s.addItem);
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<Item[] | null>(null);
  const [compartir, setCompartir] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [aviso, setAviso] = useState<{ slug: string; texto: string } | null>(null);
  useEffect(() => setMounted(true), []);

  const slugs = useMemo(() => favs.map((f) => f.slug).join(","), [favs]);
  useEffect(() => {
    if (!mounted) return;
    if (!slugs) { setItems([]); return; }
    let cancelled = false;
    fetch("/api/favoritos?slugs=" + encodeURIComponent(slugs))
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setItems(d.products ?? []); })
      .catch(() => { if (!cancelled) setItems([]); });
    return () => { cancelled = true; };
  }, [slugs, mounted]);

  // En el orden en que se guardaron, lo ultimo arriba
  const filas = useMemo(() => {
    if (!items) return [];
    return [...favs].reverse()
      .map((f) => ({ fav: f, item: items.find((i) => i.slug === f.slug) }))
      .filter((x): x is { fav: typeof favs[number]; item: Item } => !!x.item);
  }, [favs, items]);

  const visibles = filas.map((x) => x.fav);
  const link = mounted ? window.location.origin + buildListaPath(visibles, ownerName) : "";
  const mensaje = "Te paso mi lista de Member Club, por si no sabés qué regalarme 🖤\n" + link;

  const copiar = async () => {
    try { await navigator.clipboard.writeText(link); setCopiado(true); setTimeout(() => setCopiado(false), 1800); } catch { /* portapapeles bloqueado */ }
  };

  const agregar = (item: Item, v: Size) => {
    const ok = addItem({
      variantId: v.id, productId: item.id, slug: item.slug, name: item.name, brand: item.brand,
      size: v.size, price: item.price, image: item.image, maxStock: v.stock, isEncargo: item.isEncargo,
    });
    if (!ok) {
      setAviso({ slug: item.slug, texto: "Ya tenés en el carrito todo el stock de este talle" });
      setTimeout(() => setAviso(null), 2600);
    }
  };

  return (
    <div className="fav-page fav-page-ancha">
      <header className="fav-head fav-in">
        <p className="fav-rotulo">Favoritos</p>
        <h1 className="fav-h1">Tu selección</h1>
        <p className="fav-sub">Lo que guardaste, con tu talle y cómo está de stock ahora.</p>
      </header>

      {items === null ? (
        <p className="fav-vacio">Cargando…</p>
      ) : filas.length === 0 ? (
        <div className="fav-vacio-box fav-in">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#A3A3A3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={HEART_PATH} /></svg>
          <p className="fav-vacio">Todavía no guardaste nada. Tocá el corazón de cualquier producto para empezar.</p>
          <a href="/catalog" className="fav-pastilla">Ir al catálogo</a>
        </div>
      ) : (
        <>
          <div className="fav-grid">
            {filas.map(({ fav, item }, i) => {
              const e = estado(item, fav.size);
              const v = variante(item, fav.size);
              const comprable = !!v && v.stock > 0;
              return (
                <div key={item.slug} className="fav-card fav-in" style={{ animationDelay: i * 70 + "ms" }}>
                  <a href={"/product/" + item.slug} className="fav-card-foto">
                    {item.image && <img src={item.image} alt={item.name} loading="lazy" />}
                    {fav.size && <span className="fav-talle-tag">Talle {fav.size}</span>}
                    <button
                      type="button"
                      className="fav-cora on"
                      aria-label={"Quitar " + item.name + " de favoritos"}
                      onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); remove(item.slug); }}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={HEART_PATH} /></svg>
                    </button>
                  </a>
                  <a href={"/product/" + item.slug} className="fav-card-info">
                    <span className="fav-marca">{item.brand}</span>
                    <span className="nombre-producto fav-nombre">{item.name}</span>
                    <span className="precio fav-precio">${item.price.toLocaleString("es-AR")}</span>
                    <span className={"fav-chip fav-chip-" + e.tipo}>
                      {e.tipo === "ok" && <i className="fav-punto" />}
                      {e.texto}
                    </span>
                  </a>
                  {v && !comprable && item.isEncargo ? (
                    <a href={"/product/" + item.slug} className="fav-agregar fav-agregar-claro">Ver producto</a>
                  ) : v ? (
                    <button type="button" className="fav-agregar" disabled={!comprable} onClick={() => agregar(item, v)}>
                      {comprable ? "Agregar al carrito" : "Sin stock"}
                    </button>
                  ) : (
                    <a href={"/product/" + item.slug} className="fav-agregar fav-agregar-claro">Elegir talle</a>
                  )}
                  {aviso?.slug === item.slug && <span className="fav-error">{aviso.texto}</span>}
                </div>
              );
            })}
          </div>

          {/* Compu: boton al pie de la grilla */}
          <div className="fav-acciones fav-acciones-desktop fav-in" style={{ animationDelay: filas.length * 70 + "ms" }}>
            <button type="button" className="fav-pastilla" onClick={() => setCompartir(true)}><ShareIcon />Mandar mi lista</button>
            <p className="fav-sub">Ideal para regalos: quien la recibe ve qué querés y en qué talle.</p>
          </div>

          {/* Celular: barra de vidrio fija abajo */}
          <div className="fav-barra">
            <button type="button" className="fav-pastilla fav-pastilla-full" onClick={() => setCompartir(true)}><ShareIcon />Mandar mi lista</button>
          </div>
        </>
      )}

      {compartir && (
        <div className="fav-velo" onClick={(e) => { if (e.target === e.currentTarget) setCompartir(false); }}>
          <div className="fav-hoja" role="dialog" aria-label="Mandar mi lista">
            <p className="fav-rotulo">Mandar mi lista</p>
            <p className="fav-hoja-titulo">¿A nombre de quién?</p>
            <input className="fav-campo" type="text" maxLength={24} placeholder="Tu nombre" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} aria-label="Tu nombre" />
            <div className="fav-burbuja">
              Te paso mi lista de Member Club, por si no sabés qué regalarme 🖤
              <span>{ownerName.trim() ? "La selección de " + ownerName.trim() : "Mi selección"} · {visibles.length} {visibles.length === 1 ? "producto" : "productos"}</span>
            </div>
            <a className="fav-cta" href={"https://wa.me/?text=" + encodeURIComponent(mensaje)} target="_blank" rel="noopener noreferrer" onClick={() => setCompartir(false)}>Enviar por WhatsApp</a>
            <button type="button" className="fav-luego" onClick={copiar}>{copiado ? "Link copiado ✓" : "Copiar link"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
