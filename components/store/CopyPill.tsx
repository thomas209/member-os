"use client";
import { useState } from "react";

// Boton chico tipo pastilla para copiar un texto (ej: numero de seguimiento).
export default function CopyPill({ value, label = "Copiar" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // si el navegador bloquea el portapapeles no rompemos nada
    }
  };
  return (
    <button
      onClick={copy}
      style={{
        padding: "8px 16px", borderRadius: 999, border: "1px solid #D4D4D4",
        backgroundColor: copied ? "#0A0A0A" : "white", color: copied ? "white" : "#0A0A0A",
        fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.2s ease", whiteSpace: "nowrap",
      }}
    >
      {copied ? "Copiado ✓" : label}
    </button>
  );
}
