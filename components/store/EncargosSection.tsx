"use client";
import { useState, useRef } from "react";

const placeholders = [
  { id: 1, name: "Jordan 1 Retro High", brand: "Jordan" },
  { id: 2, name: "Carhartt WIP Jacket", brand: "Carhartt" },
  { id: 3, name: "Arc'teryx Beta Jacket", brand: "Arc'teryx" },
  { id: 4, name: "Stussy 8 Ball Tee", brand: "Stussy" },
  { id: 5, name: "The North Face Nuptse", brand: "The North Face" },
  { id: 6, name: "Vans Sk8-Hi", brand: "Vans" },
];

function FlipCard({ name, brand }: { name: string; brand: string }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      onClick={() => setFlipped(!flipped)}
      style={{
        width: "200px",
        aspectRatio: "3/4",
        perspective: "1000px",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      <div style={{
        position: "relative",
        width: "100%",
        height: "100%",
        transformStyle: "preserve-3d",
        transition: "transform 0.6s cubic-bezier(0.76, 0, 0.24, 1)",
        transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
      }}>

        {/* FRENTE */}
        <div style={{
          position: "absolute",
          inset: 0,
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          backgroundColor: "#111111",
          border: "1px solid #2A2A2A",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          padding: "24px",
        }}>
          <p style={{fontSize: "9px", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)"}}>
            Exclusivo
          </p>
          <p style={{fontSize: "26px", fontWeight: "800", color: "white", textAlign: "center", letterSpacing: "-0.02em", lineHeight: 1.1}}>
            ENCARGO
          </p>
          <p style={{fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginTop: "8px"}}>
            Tocar para ver
          </p>
        </div>

        {/* REVERSO */}
        <div style={{
          position: "absolute",
          inset: 0,
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
          backgroundColor: "#F4F4F4",
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{flex: 1, backgroundColor: "#E8E8E8", display: "flex", alignItems: "center", justifyContent: "center"}}>
            <p style={{fontSize: "10px", color: "#A3A3A3", letterSpacing: "0.08em"}}>SIN IMAGEN</p>
          </div>
          <div style={{padding: "12px", backgroundColor: "white", borderTop: "1px solid #E8E8E8"}}>
            <p style={{fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#737373", marginBottom: "4px"}}>{brand}</p>
            <p style={{fontSize: "13px", fontWeight: "600"}}>{name}</p>
            <p style={{fontSize: "11px", color: "#737373", marginTop: "4px"}}>Por encargo</p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function EncargosSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

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
    <section style={{backgroundColor: "#0A0A0A", padding: "48px 0"}}>
      <div style={{maxWidth: "1440px", margin: "0 auto"}}>

        <div style={{display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: "32px", paddingBottom: "16px", borderBottom: "1px solid #2A2A2A", padding: "0 16px 16px 16px"}}>
          <div>
            <p style={{fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "6px"}}>Exclusivo</p>
            <h2 style={{fontSize: "24px", fontWeight: "400", color: "white", letterSpacing: "0.02em", fontFamily: "Georgia, serif"}}>Encargos</h2>
            <p style={{fontSize: "12px", color: "rgba(255,255,255,0.3)", marginTop: "6px", letterSpacing: "0.02em"}}>Productos exclusivos traídos especialmente para vos.</p>
            <p style={{fontSize: "11px", color: "rgba(255,255,255,0.2)", marginTop: "4px", letterSpacing: "0.08em", textTransform: "uppercase"}}>Tiempo de entrega estimado: 14 días</p>
          </div>
          <a href="/encargos" style={{fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", textDecoration: "none", marginTop: "12px"}}>
            Ver todo
          </a>
        </div>

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
            gap: "8px",
            overflowX: "auto",
            cursor: "grab",
            userSelect: "none",
            paddingLeft: "16px",
            paddingRight: "16px",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {placeholders.map((p) => (
            <FlipCard key={p.id} name={p.name} brand={p.brand} />
          ))}
        </div>

      </div>
    </section>
  );
}
