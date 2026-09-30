"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";
import { fondoEsBlanco } from "@/lib/productImage";

// Foto de producto que ocupa toda la card (como siempre) y avisa si su fondo
// es de color, para que la card redondee las esquinas solo en ese caso.
export default function ProductPhoto({
  src,
  alt,
  sizes,
  priority,
  unoptimized,
  style,
  onFondoColor,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  unoptimized?: boolean;
  style?: React.CSSProperties;
  onFondoColor?: (esColor: boolean) => void;
}) {
  const ref = useRef<HTMLImageElement>(null);
  const analizar = (img: HTMLImageElement) => onFondoColor?.(!fondoEsBlanco(img));

  // Si la foto ya estaba cargada antes de que arranque la pagina, onLoad no
  // llega a dispararse: la analizamos igual.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth > 0) analizar(img);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return (
    <Image
      ref={ref}
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={unoptimized}
      crossOrigin="anonymous"
      onLoad={(e) => analizar(e.currentTarget)}
      style={{ objectFit: "cover", ...style }}
    />
  );
}
