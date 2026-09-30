"use client";
import { useState } from "react";
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
  inset = "9%",
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
        onLoad={(e) => setModo(fondoEsBlanco(e.currentTarget) ? "blanco" : "color")}
        onError={() => setModo("blanco")}
        style={{ objectFit: modo === "color" ? "cover" : "contain", mixBlendMode: "multiply", ...style }}
      />
    </div>
  );
}
