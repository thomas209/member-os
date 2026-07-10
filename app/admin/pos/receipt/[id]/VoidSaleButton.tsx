"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VoidSaleButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVoid = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/pos/order/" + orderId + "/void", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo anular la venta");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexion");
      setLoading(false);
    }
  };

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        style={{ padding: "8px 14px", fontSize: "12px", fontWeight: "600", backgroundColor: "white", color: "#DC2626", border: "1px solid #DC2626", borderRadius: "6px", cursor: "pointer" }}
      >
        Anular venta
      </button>
    );
  }

  return (
    <div style={{ padding: "14px", border: "1px solid #DC2626", borderRadius: "8px", backgroundColor: "#FEE2E2", maxWidth: "340px", margin: "0 auto" }}>
      <p style={{ fontSize: "12px", color: "#DC2626", fontWeight: "600", marginBottom: "10px" }}>
        Esto repone el stock vendido y saca la venta de los totales de caja. No se puede deshacer.
      </p>
      {error && <p style={{ fontSize: "12px", color: "#DC2626", marginBottom: "10px" }}>{error}</p>}
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          style={{ flex: 1, padding: "8px 14px", fontSize: "12px", fontWeight: "600", backgroundColor: "white", border: "1px solid #E8E8E8", borderRadius: "6px", cursor: "pointer" }}
        >
          Cancelar
        </button>
        <button
          onClick={handleVoid}
          disabled={loading}
          style={{ flex: 1, padding: "8px 14px", fontSize: "12px", fontWeight: "700", backgroundColor: "#DC2626", color: "white", border: "none", borderRadius: "6px", cursor: loading ? "default" : "pointer", opacity: loading ? 0.6 : 1 }}
        >
          {loading ? "Anulando..." : "Confirmar"}
        </button>
      </div>
    </div>
  );
}
