"use client";
import { useEffect, useRef, useState } from "react";
import { useFavStore } from "@/store/favorites";

type SizeInfo = { size: string; stock: number };

// Hoja de vidrio que aparece al tocar un corazon: se elige el talle con la
// misma pastilla deslizante de la pagina de producto y se guarda.
export default function FavSheet() {
  const sheet = useFavStore((s) => s.sheet);
  const closeSheet = useFavStore((s) => s.closeSheet);
  const add = useFavStore((s) => s.add);
  const [sizes, setSizes] = useState<SizeInfo[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pill, setPill] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  useEffect(() => {
    if (!sheet) return;
    setSizes(null); setSelected(null); setDone(false); setError(false); setPill(null);
    let cancelled = false;
    fetch("/api/favoritos?slugs=" + encodeURIComponent(sheet.slug))
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setSizes(d.products?.[0]?.sizes ?? []); })
      .catch(() => { if (!cancelled) setSizes([]); });
    return () => { cancelled = true; };
  }, [sheet]);

  useEffect(() => {
    const el = selected ? refs.current[selected] : null;
    if (el) setPill({ left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight });
  }, [selected]);

  if (!sheet) return null;
  // Productos de talle unico (carteras, arte): no hace falta elegir
  const conTalles = !!sizes && sizes.length > 1;

  const guardar = () => {
    if (conTalles && !selected) { setError(true); return; }
    add(sheet.slug, conTalles ? selected : null);
    setDone(true);
    setTimeout(closeSheet, 1500);
  };

  return (
    <div className="fav-velo" onClick={(e) => { if (e.target === e.currentTarget) closeSheet(); }}>
      <div className="fav-hoja" role="dialog" aria-label="Guardar en favoritos">
        {done ? (
          <>
            <div className="fav-listo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></div>
            <p className="fav-hoja-titulo">Guardado{conTalles && selected ? " · Talle " + selected : ""}</p>
            <p className="fav-hoja-texto">Lo encontrás en tus favoritos, arriba en el corazón.</p>
          </>
        ) : (
          <>
            <p className="fav-rotulo">{sheet.brand}</p>
            <p className="fav-hoja-titulo">{sheet.name}</p>
            {sizes === null && <p className="fav-hoja-texto">Cargando talles…</p>}
            {conTalles && (
              <>
                <p className="fav-hoja-texto">Elegí tu talle para guardarlo.</p>
                <div className="fav-talles">
                  {pill && <span aria-hidden="true" className="fav-talles-pill" style={{ left: pill.left, top: pill.top, width: pill.width, height: pill.height }} />}
                  {sizes!.map((s) => (
                    <button
                      key={s.size}
                      type="button"
                      ref={(el) => { refs.current[s.size] = el; }}
                      className={"fav-talle" + (selected === s.size ? " on" : "") + (s.stock <= 0 ? " agotado" : "")}
                      onClick={() => { setSelected(s.size); setError(false); }}
                    >
                      {s.size}
                    </button>
                  ))}
                </div>
              </>
            )}
            {error && <p className="fav-error">Elegí tu talle.</p>}
            <button type="button" className="fav-cta" disabled={sizes === null} onClick={guardar}>Guardar en favoritos</button>
            <button type="button" className="fav-luego" onClick={closeSheet}>Cancelar</button>
          </>
        )}
      </div>
    </div>
  );
}
