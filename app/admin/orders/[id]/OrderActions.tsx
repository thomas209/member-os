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

export default function OrderActions({ orderId, currentStatus, trackingNumber, paymentMethod }: { orderId: string; currentStatus: string; trackingNumber: string | null; paymentMethod?: string | null }) {
  const [status, setStatus] = useState(currentStatus);
  const [tracking, setTracking] = useState(trackingNumber || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [confirmingTransfer, setConfirmingTransfer] = useState(false);

  const isPendingTransfer = paymentMethod === "TRANSFERENCIA" && status === "PENDING";
  // El pase a PAID por transferencia tiene su propio boton (descuenta
  // stock y manda el email); se lo saco de las transiciones genericas
  // para que no se use por error sin esos efectos.
  const nextStatuses = (VALID_TRANSITIONS[status] || []).filter((s) => !(isPendingTransfer && s === "PAID"));

  const handleConfirmTransfer = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/orders/" + orderId + "/confirm-transfer", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error"); setLoading(false); return; }
      setStatus("PAID");
      setSuccess(data.oversold?.length ? "Confirmado (ojo: sin stock suficiente, revisar)" : "Transferencia confirmada");
    } catch {
      setError("Error de conexion");
    }
    setLoading(false);
  };

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
      setSuccess(data.emailWarning || "Pedido actualizado");
      setTimeout(() => setSuccess(""), 5000);
    } catch {
      setError("Error de conexion");
    }
    setLoading(false);
  };

  return (
    <div style={{backgroundColor:"white",border:"1px solid #E8E8E8",padding:"24px"}}>
      <h2 style={{fontSize:"12px",fontWeight:"600",letterSpacing:"0.1em",textTransform:"uppercase",color:"#737373",marginBottom:"20px"}}>Acciones</h2>

      {isPendingTransfer && (
        <div style={{marginBottom:"20px",padding:"16px",backgroundColor:"#FFFBEB",border:"1px solid #FDE68A"}}>
          <p style={{fontSize:"12px",color:"#92400E",marginBottom:"12px"}}>
            Este pedido es por transferencia bancaria. Confirmalo recien cuando veas la plata acreditada — ahi se descuenta el stock y se le manda el email al cliente.
          </p>
          {!confirmingTransfer ? (
            <button
              onClick={() => setConfirmingTransfer(true)}
              disabled={loading}
              style={{padding:"8px 16px",fontSize:"12px",fontWeight:"600",letterSpacing:"0.06em",textTransform:"uppercase",border:"1px solid #16A34A",backgroundColor:"white",color:"#16A34A",cursor:"pointer"}}
            >
              Confirmar transferencia recibida
            </button>
          ) : (
            <div style={{display:"flex",gap:"8px"}}>
              <button
                onClick={() => setConfirmingTransfer(false)}
                disabled={loading}
                style={{padding:"8px 16px",fontSize:"12px",fontWeight:"600",border:"1px solid #D1D1D1",backgroundColor:"white",color:"#525252",cursor:"pointer"}}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmTransfer}
                disabled={loading}
                style={{padding:"8px 16px",fontSize:"12px",fontWeight:"700",border:"none",backgroundColor:"#16A34A",color:"white",cursor:loading?"default":"pointer",opacity:loading?0.6:1}}
              >
                {loading ? "Confirmando..." : "Si, ya la vi acreditada"}
              </button>
            </div>
          )}
        </div>
      )}

      {nextStatuses.length > 0 && (
        <div style={{marginBottom:"20px"}}>
          <p style={{fontSize:"12px",color:"#737373",marginBottom:"10px"}}>Cambiar estado:</p>
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
            {nextStatuses.map((s) => {
              const blockedBySinTracking = s === "SHIPPED" && !tracking.trim();
              return (
                <button
                  key={s}
                  onClick={() => updateOrder(s)}
                  disabled={loading || blockedBySinTracking}
                  title={blockedBySinTracking ? "Cargá el número de seguimiento antes de despachar" : undefined}
                  style={{
                    padding:"8px 16px",fontSize:"12px",fontWeight:"600",letterSpacing:"0.06em",textTransform:"uppercase",
                    border: blockedBySinTracking ? "1px solid #D1D1D1" : "1px solid #0A0A0A",
                    backgroundColor: blockedBySinTracking ? "#F4F4F4" : "#0A0A0A",
                    color: blockedBySinTracking ? "#A3A3A3" : "white",
                    cursor: blockedBySinTracking ? "not-allowed" : "pointer",
                  }}
                >
                  {STATUS_LABELS[s]}
                </button>
              );
            })}
          </div>
          {nextStatuses.includes("SHIPPED") && !tracking.trim() && (
            <p style={{fontSize:"11px",color:"#D97706",marginTop:"8px"}}>
              Cargá el número de seguimiento abajo antes de marcar como despachado, así se le avisa al cliente por mail.
            </p>
          )}
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
