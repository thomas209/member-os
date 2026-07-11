"use client";
import { useState } from "react";

export default function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // si el navegador bloquea el clipboard, no rompemos nada
    }
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        padding: "6px 12px", fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
        border: "1px solid #0A0A0A", backgroundColor: copied ? "#0A0A0A" : "white", color: copied ? "white" : "#0A0A0A",
        cursor: "pointer",
      }}
    >
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}
