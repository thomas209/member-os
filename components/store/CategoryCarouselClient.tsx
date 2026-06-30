"use client";
import { useRef } from "react";

type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  comparePrice: number | null;
  image: string | null;
};

export default function CategoryCarouselClient({ products }: { products: Product[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const isDragging = useRef(false);

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.pageX - (trackRef.current?.offsetLeft || 0);
    scrollLeft.current = trackRef.current?.scrollLeft || 0;
  };
  const onMouseUp = () => { isDragging.current = false; };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - (trackRef.current?.offsetLeft || 0);
    const walk = (x - startX.current) * 2;
    if (trackRef.current) trackRef.current.scrollLeft = scrollLeft.current - walk;
  };
  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].pageX;
    scrollLeft.current = trackRef.current?.scrollLeft || 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const x = e.touches[0].pageX;
    const walk = (x - startX.current) * 2;
    if (trackRef.current) trackRef.current.scrollLeft = scrollLeft.current - walk;
  };

  return (
    <div
      ref={trackRef}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onMouseMove={onMouseMove}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      style={{
        display: "flex",
        gap: "2px",
        overflowX: "auto",
        cursor: "grab",
        userSelect: "none",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {products.map((product) => (
        <a
          key={product.slug}
          href={"/product/" + product.slug}
          style={{flexShrink: 0, width: "85vw", maxWidth: "340px", textDecoration: "none", color: "#0A0A0A", display: "block"}}
        >
          <div style={{aspectRatio: "4/5", backgroundColor: "#F4F4F4", overflow: "hidden", marginBottom: "12px"}}>
            {product.image ? (
              <img src={product.image} alt={product.name} style={{width: "100%", height: "100%", objectFit: "cover"}} />
            ) : (
              <div style={{width: "100%", height: "100%", backgroundColor: "#E8E8E8", display: "flex", alignItems: "center", justifyContent: "center"}}>
                <span style={{fontSize: "11px", color: "#A3A3A3"}}>SIN IMAGEN</span>
              </div>
            )}
          </div>
          <p style={{fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#737373", marginBottom: "4px"}}>{product.brand}</p>
          <p style={{fontSize: "13px", fontWeight: "500", marginBottom: "4px"}}>{product.name}</p>
          <div style={{display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px"}}>
            <p style={{fontSize: "13px", fontWeight: "700"}}>${product.price.toLocaleString("es-AR")}</p>
            {product.comparePrice && (
              <p style={{fontSize: "12px", color: "#A3A3A3", textDecoration: "line-through"}}>${product.comparePrice.toLocaleString("es-AR")}</p>
            )}
          </div>
        </a>
      ))}
    </div>
  );
}
