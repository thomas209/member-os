"use client";
import { useRef, useEffect, useState } from "react";

type EncargoProduct = {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  brand: { name: string };
  images: { url: string }[];
};

type Props = {
  products: EncargoProduct[];
};

const ROTATIONS = [-3, 2, -2, 4, -1, 3];

function PokerCard({ product, rotation }: { product: EncargoProduct; rotation: number }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const targetTilt = useRef({ x: 0, y: 0 });
  const currentTilt = useRef({ x: 0, y: 0 });
  const glowPos = useRef({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);
  const [flipped, setFlipped] = useState(false);

  const imageUrl = product.images[0]?.url;

  useEffect(() => {
    const animate = () => {
      const ease = 0.08;
      currentTilt.current.x += (targetTilt.current.x - currentTilt.current.x) * ease;
      currentTilt.current.y += (targetTilt.current.y - currentTilt.current.y) * ease;
      if (outerRef.current && !flipped) {
        const { x, y } = currentTilt.current;
        const lift = hovered ? -32 : 0;
        const rot = hovered ? 0 : rotation;
        outerRef.current.style.transform = "rotate(" + rot + "deg) translateY(" + lift + "px) perspective(1000px) rotateX(" + x + "deg) rotateY(" + y + "deg)";
        outerRef.current.style.filter = hovered ? "drop-shadow(0 40px 60px rgba(0,0,0,0.9))" : "drop-shadow(0 8px 20px rgba(0,0,0,0.5))";
      }
      if (glowRef.current) {
        glowRef.current.style.background = "radial-gradient(circle at " + glowPos.current.x + "% " + glowPos.current.y + "%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 40%, transparent 70%)";
        glowRef.current.style.opacity = hovered && !flipped ? "1" : "0";
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [hovered, flipped, rotation]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (flipped) return;
    const el = outerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const dy = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    targetTilt.current = { x: -dy * 10, y: dx * 10 };
    glowPos.current = { x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 };
  };

  const handleMouseLeave = () => {
    targetTilt.current = { x: 0, y: 0 };
    setHovered(false);
  };

  const handleClick = () => {
    targetTilt.current = { x: 0, y: 0 };
    currentTilt.current = { x: 0, y: 0 };
    if (outerRef.current) outerRef.current.style.transform = "rotate(0deg) translateY(-32px) perspective(1000px) rotateX(0deg) rotateY(0deg)";
    setFlipped(function(f) { return !f; });
  };

  return (
    <div
      style={{ width: "280px", aspectRatio: "2.5/3.5", flexShrink: 0, cursor: "pointer", marginRight: "-48px", position: "relative", zIndex: hovered || flipped ? 10 : 1 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <div ref={outerRef} style={{ width: "100%", height: "100%", transform: "rotate(" + rotation + "deg)", willChange: "transform", transition: flipped ? "transform 0.4s ease" : "filter 0.3s ease" }}>
        <div style={{ width: "100%", height: "100%", position: "relative", transformStyle: "preserve-3d", transition: "transform 0.7s cubic-bezier(0.76, 0, 0.24, 1)", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>
          <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", backgroundColor: "#0A0A0A", border: "1px solid #2A2A2A", borderRadius: "12px", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
            <div style={{ position: "absolute", inset: "10px", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "6px" }} />
            <div style={{ position: "absolute", inset: "16px", backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 10px)" }} />
            <div style={{ position: "absolute", top: "14px", left: "16px", textAlign: "center" }}>
              <p style={{ fontSize: "18px", fontWeight: "800", color: "rgba(255,255,255,0.45)", lineHeight: 1 }}>M</p>
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)" }}>♠</p>
            </div>
            <div style={{ position: "absolute", bottom: "14px", right: "16px", textAlign: "center", transform: "rotate(180deg)" }}>
              <p style={{ fontSize: "18px", fontWeight: "800", color: "rgba(255,255,255,0.45)", lineHeight: 1 }}>M</p>
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)" }}>♠</p>
            </div>
            <div style={{ textAlign: "center", zIndex: 1 }}>
              <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "12px" }}>Exclusivo</p>
              <p style={{ fontSize: "32px", fontWeight: "800", color: "white", letterSpacing: "-0.02em", lineHeight: 1 }}>ENCARGO</p>
              <p style={{ fontSize: "36px", color: "rgba(255,255,255,0.05)", margin: "8px 0" }}>♠</p>
              <p style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.15)" }}>Member Club</p>
            </div>
            <div ref={glowRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", transition: "opacity 0.3s ease" }} />
          </div>
          <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)", backgroundColor: "white", borderRadius: "12px", overflow: "hidden", display: "flex", flexDirection: "column", border: "1px solid #E8E8E8" }}>
            <a href={"/product/" + product.slug} style={{ flex: 1, backgroundColor: "#F0F0F0", overflow: "hidden", position: "relative", display: "block" }} onClick={(e) => { if (!flipped) e.preventDefault(); }}>
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={product.name}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: flipped ? "scale(1)" : "scale(1.2)", transition: "transform 0.8s cubic-bezier(0.23, 1, 0.32, 1) 0.3s" }}
                />
              ) : (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", transform: flipped ? "scale(1)" : "scale(1.2)", transition: "transform 0.8s cubic-bezier(0.23, 1, 0.32, 1) 0.3s" }}>
                  <p style={{ fontSize: "11px", color: "#B0B0B0", letterSpacing: "0.1em", textTransform: "uppercase" }}>Sin imagen</p>
                </div>
              )}
            </a>
            <div style={{ padding: "20px", backgroundColor: "white", borderTop: "1px solid #F0F0F0", transform: flipped ? "translateY(0)" : "translateY(20px)", opacity: flipped ? 1 : 0, transition: "transform 0.5s ease 0.4s, opacity 0.5s ease 0.4s" }}>
              <p style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#A0A0A0", marginBottom: "4px" }}>{product.brand.name}</p>
              <p style={{ fontSize: "15px", fontWeight: "700", marginBottom: "4px", letterSpacing: "-0.01em" }}>{product.name}</p>
              <p style={{ fontSize: "12px", color: "#A0A0A0" }}>Por encargo · 14 días · ${Number(product.price).toLocaleString("es-AR")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SimpleFlipCard({ product }: { product: EncargoProduct }) {
  const [flipped, setFlipped] = useState(false);
  const imageUrl = product.images[0]?.url;

  return (
    <div
      onClick={function() { setFlipped(!flipped); }}
      style={{ width: "54vw", maxWidth: "240px", aspectRatio: "2.5/3.5", flexShrink: 0, perspective: "1000px", cursor: "pointer", scrollSnapAlign: "start" }}
    >
      <div style={{
        width: "100%", height: "100%", position: "relative",
        transformStyle: "preserve-3d",
        transition: "transform 0.6s cubic-bezier(0.76, 0, 0.24, 1)",
        transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
          backgroundColor: "#111111", border: "1px solid #2A2A2A", borderRadius: "10px",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: "10px", padding: "16px",
        }}>
          <p style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>Exclusivo</p>
          <p style={{ fontSize: "20px", fontWeight: "800", color: "white", letterSpacing: "-0.02em" }}>ENCARGO</p>
          <p style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>Tocar para ver</p>
        </div>
        <div style={{
          position: "absolute", inset: 0,
          backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
          transform: "rotateY(180deg)", backgroundColor: "#F4F4F4", borderRadius: "10px",
          overflow: "hidden", position: "relative", border: "1px solid #E8E8E8",
        }}>
          {imageUrl ? (
            <img src={imageUrl} alt={product.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontSize: "10px", color: "#A3A3A3" }}>SIN IMAGEN</p>
            </div>
          )}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0,
            padding: "12px",
            background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 70%, transparent 100%)",
          }}>
            <p style={{ fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.75)", marginBottom: "3px" }}>{product.brand.name}</p>
            <p style={{ fontSize: "13px", fontWeight: "700", marginBottom: "3px", lineHeight: 1.2, color: "white" }}>{product.name}</p>
            <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.8)" }}>Por encargo</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EncargosSection({ products }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const posRef = useRef(0);

  const items = products.length > 0 ? [...products, ...products, ...products] : [];

  useEffect(() => {
    const track = trackRef.current;
    if (!track || items.length === 0) return;
    const SPEED = 0.25;
    const singleWidth = track.scrollWidth / 3;
    const animate = () => {
      if (!pausedRef.current) {
        posRef.current += SPEED;
        if (posRef.current >= singleWidth) posRef.current -= singleWidth;
        track.style.transform = "translateX(-" + posRef.current + "px)";
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [items.length]);

  if (products.length === 0) return null;

  return (
    <section style={{ backgroundColor: "#0A0A0A", padding: "48px 0", position: "relative", overflow: "hidden" }}>
      <div style={{ maxWidth: "1440px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 16px 16px 16px", marginBottom: "40px", borderBottom: "1px solid #2A2A2A" }}>
          <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "6px" }}>Exclusivo</p>
          <h2 style={{ fontSize: "24px", fontWeight: "400", color: "white", letterSpacing: "0.02em", fontFamily: "Georgia, serif" }}>Encargos</h2>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", marginTop: "6px" }}>Productos exclusivos traídos especialmente para vos.</p>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)", marginTop: "4px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Tiempo de entrega estimado: 14 días</p>
          <span style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginTop: "12px" }}>Ver todo</span>
        </div>

        <div className="encargos-desktop" style={{ overflow: "hidden", width: "100%", padding: "60px 0" }}>
          <div ref={trackRef} onMouseEnter={() => { pausedRef.current = true; }} onMouseLeave={() => { pausedRef.current = false; }} style={{ display: "flex", alignItems: "center", willChange: "transform", paddingLeft: "80px" }}>
            {items.map((p, i) => (
              <PokerCard key={p.id + "-" + i} product={p} rotation={ROTATIONS[i % ROTATIONS.length]} />
            ))}
          </div>
        </div>

        <div className="encargos-mobile" style={{ display: "none", gap: "12px", overflowX: "auto", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", padding: "0 16px" }}>
          {products.map((p) => (
            <SimpleFlipCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
