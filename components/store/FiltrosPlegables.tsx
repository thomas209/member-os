"use client";
import { useState } from "react";

// En el celular los filtros del catalogo van plegados detras de un boton
// "Filtrar", para que los productos se vean apenas se entra. En compu se
// muestran siempre, como antes.
export default function FiltrosPlegables({ activos, children }: { activos: number; children: React.ReactNode }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <button type="button" className="cat-filtrar" aria-expanded={abierto} onClick={() => setAbierto(!abierto)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <line x1="4" y1="7" x2="20" y2="7" /><line x1="7" y1="12" x2="17" y2="12" /><line x1="10" y1="17" x2="14" y2="17" />
        </svg>
        {abierto ? "Ocultar filtros" : "Filtrar"}
        {activos > 0 && <span className="cat-filtrar-n">{activos}</span>}
      </button>
      <div className={"cat-filtros" + (abierto ? " abierto" : "")}>{children}</div>
    </>
  );
}
