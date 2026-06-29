"use client";
import { useState } from "react";

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["PROCESSING", "REFUNDED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  PROCESSING: "En proceso",
  SHIPPED: "Despachado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

export default function OrderActions({ orderId, currentStatus, trackingNumber }: { orderId: string; currentStatus: string; trackingNumber: string | null }) {
  const [status, setStatus] = useState(currentStatus);
  const [tracking, setTracking] = useState(trackingNumber || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const nextStatuses = VALID_TRANSITIONS[status] || [];

  const updateOrder = async (newStatus?: string) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/orders/" + orderId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus || status,
          trackingNumber: tracking || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error"); setLoading(false); return; }
      if (newStatus) setStatus(newStatus);
      setSuccess("Pedido actualizado");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Error de conexion");
    }
    setLoading(false);
  };

  return (
    <div style={{backgroundColor:"white",border:"1px solid #E8E8E8",padding:"24px"}}>
      <h2 style={{fontSize:"12px",fontWeight:"600",letterSpacing:"0.1em",textTransform:"uppercase",color:"#737373",marginBottom:"20px"}}>Acciones</h2>

      {nextStatuses.length > 0 && (
        <div style={{marginBottom:"20px"}}>
          <p style={{fontSize:"12px",color:"#737373",marginBottom:"10px"}}>Cambiar estado:</p>
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
            {nextStatuses.map((s) => (
              <button
                key={s}
                onClick={() => updateOrder(s)}
                disabled={loading}
                style={{padding:"8px 16px",fontSize:"12px",fontWeight:"600",letterSpacing:"0.06em",textTransform:"uppercase",border:"1px solid #0A0A0A",backgroundColor:"#0A0A0A",color:"white",cursor:"pointer"}}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{marginBottom:"16px"}}>
        <label style={{display:"block",fontSize:"12px",fontWeight:"600",letterSpacing:"0.06em",textTransform:"uppercase",color:"#737373",marginBottom:"8px"}}>
          Numero de seguimiento
        </label>
        <div style={{display:"flex",gap:"8px"}}>
          <input
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="AND123456789"
            style={{flex:1,padding:"10px",border:"1px solid #D1D1D1",fontSize:"13px",outline:"none"}}
          />
          <button
            onClick={() => updateOrder()}
            disabled={loading}
            style={{padding:"10px 16px",fontSize:"12px",fontWeight:"600",border:"1px solid #0A0A0A",backgroundColor:"white",color:"#0A0A0A",cursor:"pointer"}}
          >
            Guardar
          </button>
        </div>
      </div>

      {success && <p style={{fontSize:"13px",color:"#16A34A"}}>{success}</p>}
      {error && <p style={{fontSize:"13px",color:"#DC2626"}}>{error}</p>}
    </div>
  );
}
