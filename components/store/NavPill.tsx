"use client";
import { Suspense, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Menu principal con el mismo diseno que el selector de talles.
// Al tocar una seccion, la pastilla se desliza hasta ahi (negra; roja en Arte).
// Al cargar la pagina aparece quieta en la seccion actual.
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

// Avisa cuando cambian los filtros de la direccion (?gender=..., ?category=...)
function AlCambiarFiltros({ onChange }: { onChange: () => void }) {
  const q = useSearchParams().toString();
  useEffect(onChange, [q]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// dark: version para usar sobre fondo negro (vidrio oscuro translucido)
export default function NavPill({ full = false, dark = false }: { full?: boolean; dark?: boolean }) {
  // Donde esta la pastilla: arranca en Arte
  const [pos, setPos] = useState<number>(ARTE);
  const [animar, setAnimar] = useState(false);
  const [listo, setListo] = useState(false); // no se muestra hasta saber la seccion
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [rect, setRect] = useState<{ left: number; width: number } | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const [cargando, startTransition] = useTransition();
  const ubicarRef = useRef<() => void>(() => {});

  const medir = () => {
    const el = refs.current[pos];
    setRect(el ? { left: el.offsetLeft, width: el.offsetWidth } : null);
  };
  useLayoutEffect(medir, [pos]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  // Al cargar: la pastilla aparece directo en la seccion actual, sin animacion.
  // (En paginas sin seccion, como la home, queda en Arte.)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const i = ITEMS.findIndex((it) => it.match(window.location.pathname, q));
    if (i >= 0) setPos(i);
    setListo(true);
    // La animacion se activa recien despues de ubicarla (solo para los toques)
    const t = setTimeout(() => setAnimar(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Las secciones se precargan, asi el cambio es inmediato al tocar
  useEffect(() => {
    ITEMS.forEach((it) => router.prefetch(it.href));
  }, [router]);

  // Si se navega por otro lado (boton "atras", filtros, logo), la pastilla
  // se reubica en la seccion que corresponde.
  useEffect(() => {
    const ubicar = () => {
      const q = new URLSearchParams(window.location.search);
      const i = ITEMS.findIndex((it) => it.match(window.location.pathname, q));
      if (i >= 0) setPos(i);
    };
    ubicarRef.current = ubicar;
    if (listo) ubicar();
    const alVolver = () => setTimeout(ubicar, 0);
    window.addEventListener("popstate", alVolver);
    return () => window.removeEventListener("popstate", alVolver);
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mientras llega la seccion nueva, el contenido actual se atenua suave
  // (sin recargar la pagina ni dejar la pantalla en blanco).
  useEffect(() => {
    if (!cargando) return;
    document.body.classList.add("nav-cargando");
    return () => document.body.classList.remove("nav-cargando");
  }, [cargando]);

  // Al tocar: la pastilla se desliza al instante y el contenido cambia sin
  // recargar la pagina (el logo, el menu y el carrito quedan fijos).
  const ir = (e: React.MouseEvent, i: number, href: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    setAnimar(true);
    setPos(i);
    startTransition(() => router.push(href));
  };

  const enArte = pos === ARTE;

  return (
    <nav
      className={`nav-pill relative ${full ? "flex w-full" : "inline-flex"} rounded-full`}
      aria-label="Secciones"
      style={{
        // flotante (celu): gris claro translucido con sombra suave para despegarse del contenido
        backgroundColor: dark ? "rgba(255,255,255,0.12)" : full ? "rgba(255,255,255,0.42)" : "#F5F5F5",
        boxShadow: dark
          ? "inset 0 0 0 1px rgba(255,255,255,0.18)"
          : full ? "0 8px 28px rgba(0,0,0,0.10), inset 0 0 0 1px rgba(255,255,255,0.6), inset 0 0 0 1.5px rgba(0,0,0,0.05)" : "none",
        backdropFilter: dark ? "blur(16px) saturate(160%)" : full ? "blur(22px) saturate(180%)" : undefined,
        WebkitBackdropFilter: dark ? "blur(16px) saturate(160%)" : full ? "blur(22px) saturate(180%)" : undefined,
        transition: "background-color 0.45s ease, box-shadow 0.45s ease",
      }}
    >
      <Suspense fallback={null}><AlCambiarFiltros onChange={() => { if (listo) ubicarRef.current(); }} /></Suspense>
      {listo && rect && (
        <span
          aria-hidden
          className="absolute rounded-full shadow-sm pointer-events-none"
          style={{
            top: 4,
            bottom: 4,
            left: rect.left,
            width: rect.width,
            backgroundColor: enArte ? ROJO : dark ? "#FFFFFF" : NEGRO,
            transition: animar ? `left 0.3s ${EASE}, width 0.3s ${EASE}, background-color 0.45s ease` : "none",
          }}
        />
      )}
      {ITEMS.map((it, i) => {
        const on = listo && pos === i;
        const esArte = i === ARTE;
        return (
          <a
            key={it.href}
            ref={(el) => { refs.current[i] = el; }}
            href={it.href}
            onClick={(e) => ir(e, i, it.href)}
            className={`nav-pill-item relative z-[1] rounded-full text-center no-underline transition-colors duration-[450ms] ${full ? "flex-1" : ""}`}
            style={{
              color: on
                ? (dark && !esArte ? NEGRO : "#FFFFFF")
                : esArte ? (dark ? "#FF5A5A" : ROJO) : dark ? "rgba(255,255,255,0.85)" : "#404040",
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
