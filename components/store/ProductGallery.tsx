"use client";
import { useState, useRef } from "react";

type Image = { url: string; altText?: string | null };

export default function ProductGallery({ images, productName }: { images: Image[]; productName: string }) {
  const [selected, setSelected] = useState(0);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const onTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) setSelected((s) => (s === images.length - 1 ? 0 : s + 1));
      else setSelected((s) => (s === 0 ? images.length - 1 : s - 1));
    }
  };
  if (images.length === 0) {
    return (
      <div className="aspect-[4/5] bg-neutral-100 flex items-center justify-center">
        <span className="text-[11px] text-neutral-400">SIN IMAGEN</span>
      </div>
    );
  }

  const prev = () => setSelected((s) => (s === 0 ? images.length - 1 : s - 1));
  const next = () => setSelected((s) => (s === images.length - 1 ? 0 : s + 1));

  return (
    <div className="flex flex-col gap-3">

      {/* Imagen principal */}
      <div className="relative aspect-[4/5] bg-neutral-100 overflow-hidden" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        <img
          src={images[selected].url}
          alt={images[selected].altText || productName}
          className="w-full h-full object-cover"
        />

        {images.length > 1 && (
          <>
            {/* Flecha izquierda */}
            <button
              onClick={prev}
              className="absolute left-0 top-0 bottom-0 w-[40%] flex items-center justify-start pl-4 bg-transparent border-none cursor-pointer group"
            >
              <div className="bg-white w-8 h-8 flex items-center justify-center border border-neutral-200 opacity-0 group-hover:opacity-100 transition-opacity md:flex hidden">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </div>
            </button>

            {/* Flecha derecha */}
            <button
              onClick={next}
              className="absolute right-0 top-0 bottom-0 w-[40%] flex items-center justify-end pr-4 bg-transparent border-none cursor-pointer group"
            >
              <div className="bg-white w-8 h-8 flex items-center justify-center border border-neutral-200 opacity-0 group-hover:opacity-100 transition-opacity md:flex hidden">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </button>

            {/* Dots mobile */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 md:hidden">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  className={`w-1.5 h-1.5 rounded-full border-none transition-all ${
                    i === selected ? "bg-neutral-900 w-3" : "bg-neutral-400"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails — solo desktop */}
      {images.length > 1 && (
        <div className="hidden md:flex gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`w-16 h-20 border flex-shrink-0 overflow-hidden bg-neutral-100 cursor-pointer transition-all ${
                selected === i ? "border-neutral-900" : "border-neutral-200"
              }`}
            >
              <img
                src={img.url}
                alt={img.altText || productName}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

    </div>
  );
}
