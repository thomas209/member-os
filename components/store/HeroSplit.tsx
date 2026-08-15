"use client";
import { useEffect, useState } from "react";

export default function HeroSplit() {
  const [split, setSplit] = useState(false);
  const [hoveredSide, setHoveredSide] = useState<"left" | "right" | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setSplit(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const btnStyle = (side: "left" | "right") => ({
    position: "absolute" as const,
    left: split ? (side === "left" ? "25%" : "75%") : "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    transition: "left 0.9s cubic-bezier(0.76, 0, 0.24, 1), border-color 0.2s ease, opacity 0.2s ease",
    zIndex: 10,
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "0.2em",
    textTransform: "uppercase" as const,
    color: "white",
    border: hoveredSide === side ? "1px solid rgba(255,255,255,0.9)" : "1px solid rgba(255,255,255,0.4)",
    opacity: hoveredSide && hoveredSide !== side ? 0.5 : 1,
    padding: "14px 32px",
    display: "block",
    whiteSpace: "nowrap" as const,
    textDecoration: "none",
  });

  return (
    <div style={{position: "relative", height: "60svh", backgroundColor: "#0A0A0A", overflow: "hidden"}}>

      <a href="/catalog?gender=HOMBRE" style={btnStyle("left")} onMouseEnter={() => setHoveredSide("left")} onMouseLeave={() => setHoveredSide(null)}>
        <span style={{fontSize: "32px", display: "block", marginBottom: "8px", opacity: 0.6}}>♂</span>
        Hombre
      </a>

      <a href="/catalog?gender=MUJER" style={btnStyle("right")} onMouseEnter={() => setHoveredSide("right")} onMouseLeave={() => setHoveredSide(null)}>
        <span style={{fontSize: "32px", display: "block", marginBottom: "8px", opacity: 0.6}}>♀</span>
        Mujer
      </a>

      <div style={{
        position: "absolute",
        left: "50%",
        top: 0,
        bottom: 0,
        width: "1px",
        backgroundColor: "#2A2A2A",
        transform: "translateX(-50%)",
        zIndex: 5,
      }} />

      <div style={{
        position: "absolute",
        bottom: "32px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10,
        textAlign: "center",
      }}>
        <p style={{
          fontSize: "11px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.3)",
          whiteSpace: "nowrap",
        }}>
          Nueva temporada — 2026
        </p>
      </div>

    </div>
  );
}
