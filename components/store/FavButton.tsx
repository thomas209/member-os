"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useFavStore } from "@/store/favorites";
import { HEART_PATH } from "@/components/store/FavHeart";

// Corazon del header con el numerito de guardados. Lleva a /favoritos.
export default function FavButton() {
  const count = useFavStore((s) => s.favs.length);
  const bumpCount = useFavStore((s) => s.bumpCount);
  const [mounted, setMounted] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  const prevBump = useRef(bumpCount);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (bumpCount === prevBump.current) return;
    prevBump.current = bumpCount;
    setPulsing(true);
    const t = setTimeout(() => setPulsing(false), 600);
    return () => clearTimeout(t);
  }, [bumpCount]);

  const n = mounted ? count : 0;
  return (
    <Link href="/favoritos" prefetch aria-label="Mis favoritos" className="hover-fade" style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0A0A0A", textDecoration: "none" }}>
      <svg key={pulsing ? "p" : "i"} className={pulsing ? "cart-icon-bump" : ""} width="20" height="20" viewBox="0 0 24 24" fill={n > 0 ? "#DC2626" : "none"} stroke={n > 0 ? "#DC2626" : "currentColor"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d={HEART_PATH} />
      </svg>
      {n > 0 && (
        <span key={n} className="cart-badge-pop" style={{ fontSize: "12px", fontWeight: "600", backgroundColor: "#0A0A0A", color: "white", borderRadius: "50%", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {n}
        </span>
      )}
    </Link>
  );
}
