import { create } from "zustand";
import { persist } from "zustand/middleware";

// Favoritos del cliente. Se guardan en el navegador (localStorage), igual que
// el carrito: no usan la base de datos.
export type Fav = { slug: string; size: string | null };
export type FavSize = { size: string; stock: number };
// sizes: si la card ya los trae, la hoja se abre sin esperar a la red
export type FavSheetProduct = { slug: string; name: string; brand: string; sizes?: FavSize[] };

type FavStore = {
  favs: Fav[];
  // Nombre con el que se comparte la lista ("La seleccion de ...")
  ownerName: string;
  // Producto para el que esta abierta la hoja de "elegi tu talle"
  sheet: FavSheetProduct | null;
  // Cambia cada vez que se guarda algo, para animar el corazon del header
  bumpCount: number;
  // Ultimos datos vistos en /favoritos, para mostrar la pagina al instante
  cache: unknown[];
  setCache: (cache: unknown[]) => void;
  add: (slug: string, size: string | null) => void;
  remove: (slug: string) => void;
  setOwnerName: (name: string) => void;
  openSheet: (product: FavSheetProduct) => void;
  closeSheet: () => void;
};

export const useFavStore = create<FavStore>()(
  persist(
    (set, get) => ({
      favs: [],
      ownerName: "",
      sheet: null,
      bumpCount: 0,
      cache: [],
      setCache: (cache) => set({ cache }),
      add: (slug, size) =>
        set({
          favs: [...get().favs.filter((f) => f.slug !== slug), { slug, size }],
          bumpCount: get().bumpCount + 1,
        }),
      remove: (slug) => set({ favs: get().favs.filter((f) => f.slug !== slug) }),
      setOwnerName: (ownerName) => set({ ownerName }),
      openSheet: (sheet) => set({ sheet }),
      closeSheet: () => set({ sheet: null }),
    }),
    {
      name: "mc-favoritos",
      partialize: (state) => ({ favs: state.favs, ownerName: state.ownerName, cache: state.cache }),
    }
  )
);

// Link para compartir la lista. Los productos y talles viajan en el link,
// asi no hace falta guardar nada en la base.
export function buildListaPath(favs: Fav[], ownerName: string) {
  const p = favs
    .map((f) => encodeURIComponent(f.slug) + (f.size ? "~" + encodeURIComponent(f.size) : ""))
    .join(",");
  const de = ownerName.trim().slice(0, 24);
  return "/lista?" + (de ? "de=" + encodeURIComponent(de) + "&" : "") + "p=" + p;
}

export function parseLista(p: string | undefined | null): Fav[] {
  if (!p) return [];
  const out: Fav[] = [];
  for (const part of p.split(",").slice(0, 40)) {
    const [rawSlug, rawSize] = part.split("~");
    try {
      const slug = decodeURIComponent(rawSlug || "").trim();
      const size = rawSize ? decodeURIComponent(rawSize).trim().slice(0, 12) : null;
      if (slug && /^[a-z0-9-]+$/i.test(slug) && !out.some((f) => f.slug === slug)) {
        out.push({ slug, size: size || null });
      }
    } catch {
      // parte mal formada: se ignora
    }
  }
  return out;
}
