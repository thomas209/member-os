"use client";
import { useEffect } from "react";

export default function PrintButton() {
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

  return (
    <button
      onClick={() => window.print()}
      style={{ padding: "6px 14px", fontSize: "12px", fontWeight: "600", backgroundColor: "#0A0A0A", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
    >
      Imprimir
    </button>
  );
}
