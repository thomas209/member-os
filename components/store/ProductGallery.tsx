"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import ProductPhoto from "@/components/store/ProductPhoto";

type Foto = { url: string; altText?: string | null };

// Cada foto maneja su propia forma: card redondeada si su fondo es de color.
function Slide({ foto, alt, priority }: { foto: Foto; alt: string; priority: boolean }) {
  const [fondoColor, setFondoColor] = useState(false);
  return (
    <div
      className="relative shrink-0 w-full aspect-[4/5] bg-neutral-100 overflow-hidden snap-center snap-always"
      style={{ borderRadius: fondoColor ? 18 : 0 }}
    >
      <ProductPhoto
        src={foto.url}
        alt={alt}
        sizes="(max-width: 768px) 100vw, 50vw"
        priority={priority}
        onFondoColor={setFondoColor}
      />
    </div>
  );
}

const Flecha = ({ dir }: { dir: "izq" | "der" }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points={dir === "izq" ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} />
  </svg>
);

export default function ProductGallery({ images, productName }: { images: Foto[]; productName: string }) {
  const [selected, setSelected] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const raf = useRef(0);

  // Carrusel nativo: el celular hace el deslizamiento (con su inercia y frenado)
  // y aca solo leemos en que foto quedo, para los puntitos y miniaturas.
  const onScroll = () => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const t = trackRef.current;
      if (!t) return;
      const i = Math.round(t.scrollLeft / t.clientWidth);
      setSelected(Math.max(0, Math.min(images.length - 1, i)));
    });
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const goTo = (i: number) => {
    const t = trackRef.current;
    if (!t) return;
    const destino = Math.max(0, Math.min(images.length - 1, i));
    t.scrollTo({ left: destino * t.clientWidth, behavior: "smooth" });
  };

  if (images.length === 0) {
    return (
      <div className="aspect-[4/5] bg-neutral-100 flex items-center justify-center">
        <span className="text-[11px] text-neutral-400">SIN IMAGEN</span>
      </div>
    );
  }

  const varias = images.length > 1;

  return (
    <div className="flex flex-col gap-3">

      {/* Imagen principal: carrusel que se desliza con el dedo */}
      <div className="relative group">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ overscrollBehaviorX: "contain", WebkitOverflowScrolling: "touch" }}
        >
          {images.map((img, i) => (
            <Slide key={img.url + i} foto={img} alt={img.altText || productName} priority={i === 0} />
          ))}
        </div>

        {varias && (
          <>
            {/* Flechas — solo compu, aparecen al pasar el mouse */}
            <button
              onClick={() => goTo(selected - 1)}
              aria-label="Foto anterior"
              disabled={selected === 0}
              className="hidden md:flex absolute top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-white/90 backdrop-blur border-none shadow-md cursor-pointer opacity-0 group-hover:opacity-100 disabled:!opacity-0 transition-opacity duration-200"
              style={{ left: 16 }}
            >
              <Flecha dir="izq" />
            </button>
            <button
              onClick={() => goTo(selected + 1)}
              aria-label="Foto siguiente"
              disabled={selected === images.length - 1}
              className="hidden md:flex absolute top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-white/90 backdrop-blur border-none shadow-md cursor-pointer opacity-0 group-hover:opacity-100 disabled:!opacity-0 transition-opacity duration-200"
              style={{ right: 16 }}
            >
              <Flecha dir="der" />
            </button>

            {/* Puntitos — celular */}
            <div className="absolute left-0 right-0 flex justify-center gap-1.5 md:hidden pointer-events-none" style={{ bottom: 14 }}>
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === selected ? "bg-neutral-900 w-4" : "bg-neutral-400/70 w-1.5"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Miniaturas — solo compu */}
      {varias && (
        <div className="hidden md:flex gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`relative w-16 h-20 border flex-shrink-0 overflow-hidden bg-neutral-100 cursor-pointer transition-all ${
                selected === i ? "border-neutral-900" : "border-neutral-200 opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={img.url}
                alt={img.altText || productName}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

    </div>
  );
}
