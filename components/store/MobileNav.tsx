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
  const esHome = usePathname() === "/";
  const [pegado, setPegado] = useState(false);

  useEffect(() => {
    // "pegado" = ya no hay fondo negro debajo del menu (termino el hero)
    const revisar = () => {
      const el = ref.current;
      if (!el) return;
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
  }, []);

  const blanco = !esHome || pegado;

  return (
    <div
      ref={ref}
      className={`md:hidden nav-float ${esHome ? "nav-float-home" : ""} ${blanco ? "nav-float-blanco" : ""}`}
    >
      <NavPill full dark={!blanco} />
    </div>
  );
}
