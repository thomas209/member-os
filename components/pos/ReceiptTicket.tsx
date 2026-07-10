const PAYMENT_LABELS: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TARJETA: "Tarjeta",
  TRANSFERENCIA: "Transferencia",
};

export type ReceiptOrderData = {
  orderNumber: number;
  createdAt: Date | string;
  paymentMethod: string | null;
  subtotal: number;
  discountAmount: number;
  total: number;
  couponCode: string | null;
  status: string;
  guestFirstName: string | null;
  guestLastName: string | null;
  guestPhone: string | null;
  guestEmail: string | null;
  items: { id: string; productName: string; size: string; unitPrice: number; quantity: number }[];
};

// Ticket de venta compartido entre la vista admin (con controles de anular/
// imprimir/whatsapp) y la vista publica que se manda al cliente.
export default function ReceiptTicket({ order }: { order: ReceiptOrderData }) {
  const dateStr = new Date(order.createdAt).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });

  const discountPercent = order.subtotal > 0 ? Math.round((order.discountAmount / order.subtotal) * 100) : 0;
  const voided = order.status === "CANCELLED";

  return (
    <div className="receipt-ticket" style={{ maxWidth: "340px", margin: "0 auto", backgroundColor: "white", padding: "24px", fontFamily: "monospace", fontSize: "12px", color: "#0A0A0A", position: "relative" }}>
      {voided && (
        <div style={{
          position: "absolute", top: "16px", right: "-8px", backgroundColor: "#DC2626", color: "white",
          fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em", padding: "4px 12px", transform: "rotate(8deg)",
        }}>
          ANULADA
        </div>
      )}

      <p style={{ textAlign: "center", fontWeight: "700", fontSize: "14px", marginBottom: "4px" }}>Member Club</p>
      <p style={{ textAlign: "center", color: "#737373", marginBottom: "16px" }}>Comprobante de venta</p>

      <div style={{ borderTop: "1px dashed #A3A3A3", borderBottom: "1px dashed #A3A3A3", padding: "8px 0", marginBottom: "12px" }}>
        <p>Venta #{order.orderNumber}</p>
        <p>{dateStr}</p>
        <p>Pago: {PAYMENT_LABELS[order.paymentMethod || ""] || order.paymentMethod || "-"}</p>
        {order.guestFirstName && (
          <p>Cliente: {order.guestFirstName} {order.guestLastName}</p>
        )}
        {order.guestPhone && <p>Tel: {order.guestPhone}</p>}
        {order.guestEmail && <p>Email: {order.guestEmail}</p>}
      </div>

      {order.items.map((item) => (
        <div key={item.id} style={{ marginBottom: "8px" }}>
          <p>{item.productName}</p>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Talle {item.size} x{item.quantity}</span>
            <span>${(item.unitPrice * item.quantity).toLocaleString("es-AR")}</span>
          </div>
        </div>
      ))}

      <div style={{ borderTop: "1px dashed #A3A3A3", marginTop: "12px", paddingTop: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Subtotal</span>
          <span>${order.subtotal.toLocaleString("es-AR")}</span>
        </div>
        {order.discountAmount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>
              Descuento{order.couponCode ? " (" + order.couponCode + ")" : ""} -{discountPercent}%
            </span>
            <span>-${order.discountAmount.toLocaleString("es-AR")}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "700", fontSize: "14px", marginTop: "4px" }}>
          <span>Total</span>
          <span>${order.total.toLocaleString("es-AR")}</span>
        </div>
      </div>

      <p style={{ textAlign: "center", color: "#A3A3A3", marginTop: "20px" }}>¡Gracias por tu compra!</p>
    </div>
  );
}
