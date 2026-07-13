"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BackfillButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleClick = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/customers/backfill", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Error al vincular pedidos");
      } else {
        setMessage(data.ordersLinked + " pedidos vinculados a " + data.customersTouched + " clientes.");
        router.refresh();
      }
    } catch {
      setMessage("Error de conexion");
    }
    setLoading(false);
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        style={{ padding: "10px 18px", fontSize: "12px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", border: "1px solid #D1D1D1", backgroundColor: "white", color: "#0A0A0A", cursor: loading ? "not-allowed" : "pointer" }}
      >
        {loading ? "Vinculando..." : "Vincular pedidos antiguos"}
      </button>
      {message && <p style={{ fontSize: "12px", color: "#737373", marginTop: "8px" }}>{message}</p>}
    </div>
  );
}
