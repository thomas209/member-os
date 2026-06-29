"use client";
import { useEffect, useRef } from "react";

type Brand = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
};

export default function BrandCarousel({ brands }: { brands: Brand[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);

  const startAutoplay = () => {
    autoplayRef.current = setInterval(() => {
      const track = trackRef.current;
      if (!track) return;
      track.scrollLeft += 1;
      if (track.scrollLeft >= track.scrollWidth / 2) {
        track.scrollLeft = 0;
      }
    }, 20);
  };

  const stopAutoplay = () => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
  };

  useEffect(() => {
    startAutoplay();
    return () => stopAutoplay();
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].pageX;
    scrollLeft.current = trackRef.current?.scrollLeft || 0;
    stopAutoplay();
  };

  const onTouchEnd = () => startAutoplay();

  const onTouchMove = (e: React.TouchEvent) => {
    const x = e.touches[0].pageX;
    const walk = (x - startX.current) * 2;
    if (trackRef.current) trackRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const duplicated = [...brands, ...brands];

  return (
    <div style={{backgroundColor: "white", borderTop: "1px solid #E8E8E8", borderBottom: "1px solid #E8E8E8", padding: "32px 0", overflow: "hidden"}}>
      <div
        ref={trackRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchMove={onTouchMove}
        style={{display: "flex", gap: "64px", overflowX: "hidden", userSelect: "none", paddingLeft: "32px"}}
      >
        {duplicated.map((brand, i) => (
          <a
            key={i}
            href={"/catalog?brand=" + brand.slug}
            style={{flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none"}}
          >
            {brand.logoUrl ? (
              <img
                src={brand.logoUrl}
                alt={brand.name}
                style={{height: "32px", width: "100px", objectFit: "contain", filter: "grayscale(100%)", opacity: 0.7}}
              />
            ) : (
              <span style={{fontSize: "13px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "#A3A3A3"}}>
                {brand.name}
              </span>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
