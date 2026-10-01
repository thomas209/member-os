"use client";
import { useEffect, useRef, useState } from "react";
import NavPill from "@/components/store/NavPill";

// Menu de secciones en el celular.
// En la home arranca flotando sobre la parte negra del hero; al bajar, se
// queda pegado abajo de la barra del logo y pasa a fondo blanco (se "une").
// En el resto de las paginas va siempre pegado, con fondo blanco.
const ALTO_HEADER = 57; // barra del logo (56px) + linea

export default function MobileNav() {
  const ref = useRef<HTMLDivElement>(null);
  const [esHome, setEsHome] = useState(false);
  const [pegado, setPegado] = useState(false);

  useEffect(() => {
    setEsHome(window.location.pathname === "/");
    const revisar = () => {
      const el = ref.current;
      if (!el) return;
      setPegado(el.getBoundingClientRect().top <= ALTO_HEADER + 0.5);
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
      <NavPill full />
    </div>
  );
}
