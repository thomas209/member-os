"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { fondoEsBlanco } from "@/lib/productImage";

// Foto de producto que se acomoda sola segun su fondo:
// fondo blanco -> centrada con aire; fondo de color -> ocupa toda la card.
export default function ProductPhoto({
  src,
  alt,
  sizes,
  priority,
  unoptimized,
  inset = "var(--foto-aire)",
  style,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  unoptimized?: boolean;
  inset?: string;
  style?: React.CSSProperties;
}) {
  const [modo, setModo] = useState<"blanco" | "color" | null>(null);
  const ref = useRef<HTMLImageElement>(null);
  const analizar = (img: HTMLImageElement) => setModo(fondoEsBlanco(img) ? "blanco" : "color");

  // Si la foto ya estaba cargada antes de que arranque la pagina, onLoad no
  // llega a dispararse: la analizamos igual. Y si por algo no se pudo decidir,
  // a los 1,5 s se muestra igual (nunca queda invisible).
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth > 0) analizar(img);
    const t = setTimeout(() => setModo((m) => m ?? "blanco"), 1500);
    return () => clearTimeout(t);
  }, [src]);
  return (
    <div style={{ position: "absolute", inset: modo === "color" ? 0 : inset, opacity: modo ? 1 : 0, transition: "opacity 0.2s ease" }}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={unoptimized}
        crossOrigin="anonymous"
        ref={ref}
        onLoad={(e) => analizar(e.currentTarget)}
        onError={() => setModo("blanco")}
        style={{ objectFit: modo === "color" ? "cover" : "contain", mixBlendMode: "multiply", ...style }}
      />
    </div>
  );
}
