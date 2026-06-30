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

function ProductTile({ product }: { product: Product }) {
  return (
    <a
      href={"/product/" + product.slug}
      style={{ textDecoration: "none", color: "#0A0A0A", display: "block" }}
    >
      <div style={{ aspectRatio: "4/5", backgroundColor: "#F4F4F4", overflow: "hidden", marginBottom: "10px" }}>
        {product.image ? (
          <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", backgroundColor: "#E8E8E8", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "10px", color: "#A3A3A3" }}>SIN IMAGEN</span>
          </div>
        )}
      </div>
      <p style={{ fontSize: "9px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#737373", marginBottom: "3px" }}>{product.brand}</p>
      <p style={{ fontSize: "12px", fontWeight: "500", marginBottom: "3px", lineHeight: 1.2 }}>{product.name}</p>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <p style={{ fontSize: "12px", fontWeight: "700" }}>${product.price.toLocaleString("es-AR")}</p>
        {product.comparePrice && (
          <p style={{ fontSize: "11px", color: "#A3A3A3", textDecoration: "line-through" }}>${product.comparePrice.toLocaleString("es-AR")}</p>
        )}
      </div>
    </a>
  );
}

function ProductRow({ products }: { products: Product[] }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        overflowX: "auto",
        scrollSnapType: "x mandatory",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {products.map((product) => (
        <div key={product.slug} style={{ flexShrink: 0, width: "44vw", scrollSnapAlign: "start" }}>
          <ProductTile product={product} />
        </div>
      ))}
    </div>
  );
}

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

  // Dividir en dos filas: pares e impares
  const rowTop = products.filter((_, i) => i % 2 === 0);
  const rowBottom = products.filter((_, i) => i % 2 === 1);

  return (
    <>
      {/* DESKTOP: una sola fila */}
      <div
        ref={trackRef}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onMouseMove={onMouseMove}
        className="category-row-desktop"
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
          <div key={product.slug} style={{ flexShrink: 0, width: "260px" }}>
            <ProductTile product={product} />
          </div>
        ))}
      </div>

      {/* MOBILE: dos filas, cada una con scroll independiente */}
      <div className="category-grid-mobile" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <ProductRow products={rowTop} />
        <ProductRow products={rowBottom} />
      </div>
    </>
  );
}
