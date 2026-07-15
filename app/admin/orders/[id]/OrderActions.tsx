"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["PROCESSING", "REFUNDED"],
  PROCESSING: ["CANCELLED"], // SHIPPED se maneja aparte, por item (ver abajo)
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

type Item = {
  id: string;
  productName: string;
  size: string;
  quantity: number;
  isEncargo: boolean;
  trackingNumber: string | null;
  shippedAt: string | null;
};

export default function OrderActions({
  orderId,
  currentStatus,
  paymentMethod,
  items,
}: {
  orderId: string;
  currentStatus: string;
  paymentMethod?: string | null;
  items: Item[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [confirmingTransfer, setConfirmingTransfer] = useState(false);

  const unshipped = items.filter((i) => !i.shippedAt);
  const shipped = items.filter((i) => i.shippedAt);
  const [checkedIds, setCheckedIds] = useState<string[]>(unshipped.map((i) => i.id));
  const [tracking, setTracking] = useState("");

  // status/checkedIds arrancan de las props, pero despues del despacho
  // hacemos router.refresh() (trae items nuevos del server) en vez de
  // recargar toda la pagina: hay que resincronizar el estado local con
  // las props nuevas o quedaria mostrando el pedido como "en proceso"
  // con productos ya despachados.
  useEffect(() => {
    setStatus(currentStatus);
  }, [currentStatus]);

  useEffect(() => {
    setCheckedIds(items.filter((i) => !i.shippedAt).map((i) => i.id));
  }, [items]);

  const isPendingTransfer = paymentMethod === "TRANSFERENCIA" && status === "PENDING";
  const nextStatuses = (VALID_TRANSITIONS[status] || []).filter((s) => !(isPendingTransfer && s === "PAID"));

  const toggleItem = (id: string) => {
    setCheckedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

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

  const updateStatus = async (newStatus: string) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/orders/" + orderId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error"); setLoading(false); return; }
      setStatus(newStatus);
      setSuccess("Pedido actualizado");
      setTimeout(() => setSuccess(""), 5000);
    } catch {
      setError("Error de conexion");
    }
    setLoading(false);
  };

  const handleDespachar = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/orders/" + orderId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: checkedIds, trackingNumber: tracking }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error"); setLoading(false); return; }
      setSuccess(
        data.emailWarning ||
        (data.allShipped ? "Pedido despachado" : "Despachado parcial guardado — el resto sigue pendiente")
      );
      setTracking("");
      router.refresh();
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

      {/* Despacho por item — solo mientras el pedido esta en proceso */}
      {status === "PROCESSING" && (
        <div style={{marginBottom:"20px",paddingBottom:"20px",borderBottom:"1px solid #F4F4F4"}}>
          <p style={{fontSize:"12px",color:"#737373",marginBottom:"10px"}}>
            {shipped.length > 0 ? "Despachar el resto:" : "Despachar:"}
          </p>

          {shipped.length > 0 && (
            <div style={{marginBottom:"12px",display:"flex",flexDirection:"column",gap:"4px"}}>
              {shipped.map((item) => (
                <p key={item.id} style={{fontSize:"12px",color:"#A3A3A3"}}>
                  ✓ {item.productName} (talle {item.size}) — despachado, seguimiento {item.trackingNumber}
                </p>
              ))}
            </div>
          )}

          <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"12px"}}>
            {unshipped.map((item) => (
              <label key={item.id} style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"13px",cursor:"pointer"}}>
                <input
                  type="checkbox"
                  checked={checkedIds.includes(item.id)}
                  onChange={() => toggleItem(item.id)}
                />
                <span>
                  {item.productName} (talle {item.size}) x{item.quantity}
                  {item.isEncargo && <span style={{color:"#A3A3A3"}}> · por encargo</span>}
                </span>
              </label>
            ))}
          </div>

          <div style={{display:"flex",gap:"8px",marginBottom:"8px"}}>
            <input
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="Numero de seguimiento (AND123456789)"
              style={{flex:1,padding:"10px",border:"1px solid #D1D1D1",fontSize:"13px",outline:"none"}}
            />
            <button
              onClick={handleDespachar}
              disabled={loading || checkedIds.length === 0 || !tracking.trim()}
              title={!tracking.trim() ? "Cargá el número de seguimiento antes de despachar" : undefined}
              style={{
                padding:"10px 16px",fontSize:"12px",fontWeight:"600",letterSpacing:"0.06em",textTransform:"uppercase",
                border: (checkedIds.length === 0 || !tracking.trim()) ? "1px solid #D1D1D1" : "1px solid #0A0A0A",
                backgroundColor: (checkedIds.length === 0 || !tracking.trim()) ? "#F4F4F4" : "#0A0A0A",
                color: (checkedIds.length === 0 || !tracking.trim()) ? "#A3A3A3" : "white",
                cursor: (checkedIds.length === 0 || !tracking.trim()) ? "not-allowed" : "pointer",
                whiteSpace:"nowrap",
              }}
            >
              Despachar {checkedIds.length < unshipped.length ? "seleccionados" : ""}
            </button>
          </div>
          {checkedIds.length > 0 && checkedIds.length < unshipped.length && (
            <p style={{fontSize:"11px",color:"#D97706"}}>
              El resto queda pendiente para despachar despues, por separado.
            </p>
          )}
        </div>
      )}

      {nextStatuses.length > 0 && (
        <div style={{marginBottom:"20px"}}>
          <p style={{fontSize:"12px",color:"#737373",marginBottom:"10px"}}>Cambiar estado:</p>
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
            {nextStatuses.map((s) => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                disabled={loading}
                style={{
                  padding:"8px 16px",fontSize:"12px",fontWeight:"600",letterSpacing:"0.06em",textTransform:"uppercase",
                  border:"1px solid #0A0A0A", backgroundColor:"#0A0A0A", color:"white", cursor:"pointer",
                }}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      )}

      {success && <p style={{fontSize:"13px",color:"#16A34A"}}>{success}</p>}
      {error && <p style={{fontSize:"13px",color:"#DC2626"}}>{error}</p>}
    </div>
  );
}
