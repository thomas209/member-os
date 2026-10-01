"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

// Menu principal con el mismo diseno que el selector de talles.
// La pastilla arranca en Arte (roja) y se desliza a la seccion elegida,
// volviendose negra. Si vuelve a Arte, se pone roja de nuevo.
const ITEMS = [
  { label: "Catálogo", href: "/catalog", match: (p: string, q: URLSearchParams) => p === "/catalog" && !q.get("gender") && q.get("category") !== "arte" },
  { label: "Hombre", href: "/catalog?gender=HOMBRE", match: (p: string, q: URLSearchParams) => p === "/catalog" && q.get("gender") === "HOMBRE" },
  { label: "Mujer", href: "/catalog?gender=MUJER", match: (p: string, q: URLSearchParams) => p === "/catalog" && q.get("gender") === "MUJER" },
  { label: "Arte", href: "/catalog?category=arte", match: (p: string, q: URLSearchParams) => p === "/catalog" && q.get("category") === "arte" },
];
const ARTE = 3;
const ROJO = "#DC2626";
const NEGRO = "#0A0A0A";
const EASE = "cubic-bezier(0.32,0.72,0,1)";

export default function NavPill({ full = false }: { full?: boolean }) {
  // Donde esta la pastilla: arranca en Arte
  const [pos, setPos] = useState<number>(ARTE);
  const [animar, setAnimar] = useState(false);
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [rect, setRect] = useState<{ left: number; width: number } | null>(null);

  const medir = () => {
    const el = refs.current[pos];
    setRect(el ? { left: el.offsetLeft, width: el.offsetWidth } : null);
  };
  useLayoutEffect(medir, [pos]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  // Al cargar: si estas en otra seccion, la pastilla viaja desde Arte hasta ahi
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const i = ITEMS.findIndex((it) => it.match(window.location.pathname, q));
    if (i >= 0 && i !== ARTE) {
      const t = setTimeout(() => { setAnimar(true); setPos(i); }, 120);
      return () => clearTimeout(t);
    }
    requestAnimationFrame(() => setAnimar(true));
  }, []);

  // Al tocar: la pastilla se desliza y despues cambia de pagina
  const ir = (e: React.MouseEvent, i: number, href: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    setAnimar(true);
    setPos(i);
    setTimeout(() => { window.location.href = href; }, 260);
  };

  const enArte = pos === ARTE;

  return (
    <nav className={`nav-pill relative ${full ? "flex w-full" : "inline-flex"} rounded-full bg-neutral-100`} aria-label="Secciones">
      {rect && (
        <span
          aria-hidden
          className="absolute rounded-full shadow-sm pointer-events-none"
          style={{
            top: 4,
            bottom: 4,
            left: rect.left,
            width: rect.width,
            backgroundColor: enArte ? ROJO : NEGRO,
            transition: animar ? `left 0.3s ${EASE}, width 0.3s ${EASE}, background-color 0.3s ease` : "none",
          }}
        />
      )}
      {ITEMS.map((it, i) => {
        const on = pos === i;
        const esArte = i === ARTE;
        return (
          <a
            key={it.href}
            ref={(el) => { refs.current[i] = el; }}
            href={it.href}
            onClick={(e) => ir(e, i, it.href)}
            className={`nav-pill-item relative z-[1] rounded-full text-center no-underline transition-colors duration-300 ${full ? "flex-1" : ""}`}
            style={{
              color: on ? "#FFFFFF" : esArte ? ROJO : "#404040",
              fontWeight: on || esArte ? 600 : 500,
            }}
          >
            {it.label}
          </a>
        );
      })}
    </nav>
  );
}
