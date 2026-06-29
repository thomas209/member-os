"use client";
import { useCartStore } from "@/store/cart";
import { useEffect, useState } from "react";

export default function CartButton() {
  const { openCart, totalItems } = useCartStore();
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(totalItems());
  }, [totalItems]);

  return (
    <button
      onClick={openCart}
      aria-label="Carrito de compras"
      style={{background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", color: "#0A0A0A"}}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
      {count > 0 && (
        <span style={{fontSize: "12px", fontWeight: "600", backgroundColor: "#0A0A0A", color: "white", borderRadius: "50%", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center"}}>
          {count}
        </span>
      )}
    </button>
  );
}
