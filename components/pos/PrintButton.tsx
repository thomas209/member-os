"use client";
import { useEffect, useState } from "react";

// variant="admin" (default): botón chico, como el resto del panel interno.
// variant="store": mismo lenguaje visual que los botones de la tienda
// (sin bordes redondeados, mayúsculas, letter-spacing ancho) porque esta
// vista la ve el cliente final.
export default function PrintButton({ variant = "admin" }: { variant?: "admin" | "store" }) {
  const [hover, setHover] = useState(false);

  // Si se llega con ?print=1 (desde "Ver comprobante" en el POS), imprime
  // directo sin que el cajero tenga que tocar el boton.
  // Se lee window.location directo (en vez de useSearchParams) para no
  // necesitar un Suspense boundary alrededor de la pagina.
  useEffect(() => {
    const autoPrint = new URLSearchParams(window.location.search).get("print") === "1";
    if (autoPrint) {
      const t = setTimeout(() => window.print(), 300);
      return () => clearTimeout(t);
    }
  }, []);

  if (variant === "store") {
    return (
      <button
        onClick={() => window.print()}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "16px",
          fontSize: "13px",
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          backgroundColor: hover ? "#F4F4F4" : "white",
          color: "#0A0A0A",
          border: "1px solid #0A0A0A",
          borderRadius: 0,
          cursor: "pointer",
          transition: "background-color 0.15s ease",
        }}
      >
        Imprimir comprobante
      </button>
    );
  }

  return (
    <button
      onClick={() => window.print()}
      style={{ padding: "6px 14px", fontSize: "12px", fontWeight: "600", backgroundColor: "#0A0A0A", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
    >
      Imprimir
    </button>
  );
}
