"use client";
import { useEffect, useRef, useState } from "react";
import { useFavStore } from "@/store/favorites";

export const HEART_PATH = "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z";

// Corazon de favoritos para las cards. Va dentro del recuadro de la foto
// (que tiene position: relative). Funciona igual en fotos con card redondeada
// y en fotos de fondo blanco sin card.
export default function FavHeart({ slug, name, brand, compact = false }: { slug: string; name: string; brand: string; compact?: boolean }) {
  const fav = useFavStore((s) => s.favs.find((f) => f.slug === slug));
  const remove = useFavStore((s) => s.remove);
  const openSheet = useFavStore((s) => s.openSheet);
  // Lo guardado vive en el navegador: recien se puede leer despues de montar
  const [mounted, setMounted] = useState(false);
  const [pop, setPop] = useState(false);
  const wasOn = useRef(false);
  useEffect(() => setMounted(true), []);

  const on = mounted && !!fav;
  useEffect(() => {
    if (!mounted) return;
    if (on && !wasOn.current) {
      setPop(true);
      const t = setTimeout(() => setPop(false), 520);
      wasOn.current = true;
      return () => clearTimeout(t);
    }
    wasOn.current = on;
  }, [on, mounted]);
  // Al cargar la pagina con cosas ya guardadas no queremos el "pop"
  useEffect(() => { wasOn.current = !!useFavStore.getState().favs.find((f) => f.slug === slug); }, [slug]);

  return (
    <>
      <button
        type="button"
        className={"fav-cora" + (compact ? " fav-cora-chico" : "") + (on ? " on" : "") + (pop ? " pop" : "")}
        aria-pressed={on}
        aria-label={on ? "Quitar " + name + " de favoritos" : "Guardar " + name + " en favoritos"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (on) remove(slug);
          else openSheet({ slug, name, brand });
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={HEART_PATH} /></svg>
      </button>
      {on && fav?.size && !compact && <span className="fav-talle-tag">Tu talle · {fav.size}</span>}
    </>
  );
}
