"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{ padding: "6px 14px", fontSize: "12px", fontWeight: "600", backgroundColor: "#0A0A0A", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
    >
      Imprimir
    </button>
  );
}
