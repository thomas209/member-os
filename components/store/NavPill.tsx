"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

// Menu principal con el mismo diseno que el selector de talles:
// pastilla gris y una pastilla que se desliza a la seccion activa.
const ITEMS = [
  { label: "Catálogo", href: "/catalog", match: (p: string, q: URLSearchParams) => p === "/catalog" && !q.get("gender") && q.get("category") !== "arte" },
  { label: "Hombre", href: "/catalog?gender=HOMBRE", match: (p: string, q: URLSearchParams) => p === "/catalog" && q.get("gender") === "HOMBRE" },
  { label: "Mujer", href: "/catalog?gender=MUJER", match: (p: string, q: URLSearchParams) => p === "/catalog" && q.get("gender") === "MUJER" },
  { label: "Arte", href: "/catalog?category=arte", match: (p: string, q: URLSearchParams) => p === "/catalog" && q.get("category") === "arte", arte: true },
];

const EASE = "cubic-bezier(0.32,0.72,0,1)";

export default function NavPill({ full = false }: { full?: boolean }) {
  const [activo, setActivo] = useState<number | null>(null);
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);
  const [animar, setAnimar] = useState(false);

  // Seccion activa segun la URL (se lee en el navegador)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const i = ITEMS.findIndex((it) => it.match(window.location.pathname, q));
    setActivo(i >= 0 ? i : null);
  }, []);

  const medir = () => {
    const el = activo !== null ? refs.current[activo] : null;
    setPill(el ? { left: el.offsetLeft, width: el.offsetWidth } : null);
  };
  useLayoutEffect(medir, [activo]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (pill && !animar) requestAnimationFrame(() => setAnimar(true));
  }, [pill, animar]);

  // Al tocar: la pastilla se desliza y despues cambia de pagina
  const ir = (e: React.MouseEvent, i: number, href: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    setAnimar(true);
    setActivo(i);
    setTimeout(() => { window.location.href = href; }, 230);
  };

  // Arte tiene su propia pastilla roja fija; la negra solo se mueve entre las demas
  const esArte = activo !== null && !!ITEMS[activo].arte;

  return (
    <nav className={`nav-pill relative ${full ? "flex w-full" : "inline-flex"} rounded-full bg-neutral-100`} aria-label="Secciones">
      {pill && !esArte && (
        <span
          aria-hidden
          className="absolute rounded-full shadow-sm pointer-events-none"
          style={{
            top: 4,
            bottom: 4,
            left: pill.left,
            width: pill.width,
            backgroundColor: "#0A0A0A",
            transition: animar ? `left 0.3s ${EASE}, width 0.3s ${EASE}` : "none",
          }}
        />
      )}
      {ITEMS.map((it, i) => {
        const on = activo === i;
        return (
          <a
            key={it.href}
            ref={(el) => { refs.current[i] = el; }}
            href={it.href}
            onClick={(e) => ir(e, i, it.href)}
            className={`nav-pill-item relative z-[1] rounded-full text-center no-underline transition-colors duration-300 ${full ? "flex-1" : ""}`}
            style={{
              color: on || it.arte ? "#FFFFFF" : "#404040",
              backgroundColor: it.arte ? "#DC2626" : "transparent",
              fontWeight: on || it.arte ? 600 : 500,
            }}
          >
            {it.label}
          </a>
        );
      })}
    </nav>
  );
}
