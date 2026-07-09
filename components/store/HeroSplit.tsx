"use client";
import { useEffect, useState } from "react";

export default function HeroSplit() {
  const [split, setSplit] = useState(false);
  const [arteHovered, setArteHovered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSplit(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const btnStyle = (side: "left" | "right") => ({
    position: "absolute" as const,
    left: split ? (side === "left" ? "25%" : "75%") : "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    transition: "left 0.9s cubic-bezier(0.76, 0, 0.24, 1)",
    zIndex: 10,
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "0.2em",
    textTransform: "uppercase" as const,
    color: "white",
    border: "1px solid rgba(255,255,255,0.4)",
    padding: "14px 32px",
    display: "block",
    whiteSpace: "nowrap" as const,
    textDecoration: "none",
  });

  const arteBaseTransform = split ? "translate(-50%, -50%)" : "translate(-50%, -50%) scale(0.5)";
  const arteHoverScale = arteHovered ? " scale(1.08)" : "";

  return (
    <div style={{position: "relative", height: "60svh", backgroundColor: "#0A0A0A", overflow: "hidden"}}>

      <a href="/catalog?gender=HOMBRE" style={btnStyle("left")}>
        <span style={{fontSize: "32px", display: "block", marginBottom: "8px", opacity: 0.6}}>♂</span>
        Hombre
      </a>

      <a href="/catalog?gender=MUJER" style={btnStyle("right")}>
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

      {/* Bloque ARTE: cuadrado chico centrado, solo imagen, con efecto hover */}
      <a
        href="/catalog?category=arte"
        onMouseEnter={() => setArteHovered(true)}
        onMouseLeave={() => setArteHovered(false)}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: arteBaseTransform + arteHoverScale,
          opacity: split ? 1 : 0,
          transition: "transform 0.4s cubic-bezier(0.76, 0, 0.24, 1), opacity 0.6s ease, box-shadow 0.4s ease",
          zIndex: 15,
          width: "160px",
          height: "160px",
          borderRadius: "8px",
          overflow: "hidden",
          display: "block",
          textDecoration: "none",
          boxShadow: arteHovered ? "0 12px 40px rgba(0,0,0,0.7)" : "0 8px 32px rgba(0,0,0,0.5)",
          backgroundImage: "url(https://res.cloudinary.com/dklvmlzds/image/upload/v1783556969/E9AD6534-1BDC-4FDD-A4B0-1FD28ECB0CBC_kbst0p.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

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
