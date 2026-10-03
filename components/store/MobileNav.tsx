"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import NavPill from "@/components/store/NavPill";

// Menu de secciones en el celular.
// En la home flota sobre la parte negra del hero (version oscura) y recien
// cuando termina el hero pasa a fondo blanco, unido a la barra del logo.
// En el resto de las paginas va siempre pegado, con fondo blanco.
const ALTO_HEADER = 57; // barra del logo (56px) + linea

export default function MobileNav() {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const esHome = pathname === "/";
  const [pegado, setPegado] = useState(false);
  // Se esconde al bajar (para no tapar el contenido) y vuelve al subir
  const [oculto, setOculto] = useState(false);
  const ultimoY = useRef(0);

  useEffect(() => {
    // "pegado" = ya no hay fondo negro debajo del menu (termino el hero)
    const revisar = () => {
      const el = ref.current;
      if (!el) return;
      const y = window.scrollY;
      if (y < 160 || y < ultimoY.current - 6) setOculto(false);
      else if (y > ultimoY.current + 6) setOculto(true);
      ultimoY.current = y;
      const hero = document.querySelector("[data-nav-oscuro]");
      if (!hero) { setPegado(el.getBoundingClientRect().top <= ALTO_HEADER + 0.5); return; }
      const finHero = hero.getBoundingClientRect().bottom;
      const finMenu = el.getBoundingClientRect().bottom;
      setPegado(finHero <= finMenu);
    };
    revisar();
    window.addEventListener("scroll", revisar, { passive: true });
    window.addEventListener("resize", revisar);
    return () => {
      window.removeEventListener("scroll", revisar);
      window.removeEventListener("resize", revisar);
    };
    // Se vuelve a revisar al cambiar de pagina (ahora se navega sin recargar)
  }, [pathname]);

  const blanco = !esHome || pegado;
  // En el checkout no va el menu de secciones: distrae del pago
  if (pathname.startsWith("/checkout")) return null;

  return (
    <div
      ref={ref}
      className={`md:hidden nav-float ${esHome ? "nav-float-home" : ""} ${blanco ? "nav-float-blanco" : ""}`}
      style={{
        transform: oculto ? "translateY(-140%)" : "none",
        opacity: oculto ? 0 : 1,
        pointerEvents: oculto ? "none" : "auto",
        transition: "transform 0.4s cubic-bezier(0.32,0.72,0,1), opacity 0.3s ease, background-color 0.45s ease",
      }}
    >
      <NavPill full dark={!blanco} />
    </div>
  );
}
