export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PrintButton from "./PrintButton";

const PAYMENT_LABELS: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TARJETA: "Tarjeta",
  TRANSFERENCIA: "Transferencia",
};

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) notFound();

  const dateStr = new Date(order.createdAt).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });

  const subtotalNum = Number(order.subtotal);
  const discountNum = Number(order.discountAmount);
  const discountPercent = subtotalNum > 0 ? Math.round((discountNum / subtotalNum) * 100) : 0;

  return (
    <div style={{ padding: "24px", backgroundColor: "#F4F4F4", minHeight: "100vh" }}>
      <div className="no-print" style={{ maxWidth: "340px", margin: "0 auto 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/admin/pos" style={{ fontSize: "12px", color: "#737373", textDecoration: "none" }}>← Volver al POS</a>
        <PrintButton />
      </div>

      <div className="receipt-ticket" style={{ maxWidth: "340px", margin: "0 auto", backgroundColor: "white", padding: "24px", fontFamily: "monospace", fontSize: "12px", color: "#0A0A0A" }}>
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
              <span>${(Number(item.unitPrice) * item.quantity).toLocaleString("es-AR")}</span>
            </div>
          </div>
        ))}

        <div style={{ borderTop: "1px dashed #A3A3A3", marginTop: "12px", paddingTop: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Subtotal</span>
            <span>${Number(order.subtotal).toLocaleString("es-AR")}</span>
          </div>
          {discountNum > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>
                Descuento{order.couponCode ? " (" + order.couponCode + ")" : ""} -{discountPercent}%
              </span>
              <span>-${discountNum.toLocaleString("es-AR")}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "700", fontSize: "14px", marginTop: "4px" }}>
            <span>Total</span>
            <span>${Number(order.total).toLocaleString("es-AR")}</span>
          </div>
        </div>

        <p style={{ textAlign: "center", color: "#A3A3A3", marginTop: "20px" }}>¡Gracias por tu compra!</p>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .receipt-ticket, .receipt-ticket * { visibility: visible; }
          .receipt-ticket { position: absolute; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
