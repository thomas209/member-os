export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PrintButton from "@/components/pos/PrintButton";
import ReceiptTicket from "@/components/pos/ReceiptTicket";
import VoidSaleButton from "./VoidSaleButton";
import { buildWhatsappLink } from "@/lib/whatsapp";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, cashRegisterSession: { select: { status: true } } },
  });

  if (!order) notFound();

  const ticketData = {
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    paymentMethod: order.paymentMethod,
    subtotal: Number(order.subtotal),
    discountAmount: Number(order.discountAmount),
    total: Number(order.total),
    couponCode: order.couponCode,
    status: order.status,
    guestFirstName: order.guestFirstName,
    guestLastName: order.guestLastName,
    guestPhone: order.guestPhone,
    guestEmail: order.guestEmail,
    items: order.items.map((i) => ({
      id: i.id,
      productName: i.productName,
      size: i.size,
      unitPrice: Number(i.unitPrice),
      quantity: i.quantity,
    })),
  };

  const canVoid = order.channel === "POS" && order.status !== "CANCELLED" && order.cashRegisterSession?.status === "OPEN";
  const alreadyClosed = order.channel === "POS" && order.status !== "CANCELLED" && order.cashRegisterSession?.status !== "OPEN";

  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  const publicReceiptUrl = baseUrl + "/receipt/" + order.id;
  const whatsappLink = order.guestPhone
    ? buildWhatsappLink(
        order.guestPhone,
        "Hola" + (order.guestFirstName ? " " + order.guestFirstName : "") + "! Te paso el comprobante de tu compra en Member Club: " + publicReceiptUrl
      )
    : null;

  return (
    <div style={{ padding: "24px", backgroundColor: "#F4F4F4", minHeight: "100vh" }}>
      <div className="no-print" style={{ maxWidth: "340px", margin: "0 auto 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/admin/pos" style={{ fontSize: "12px", color: "#737373", textDecoration: "none" }}>← Volver al POS</a>
        <PrintButton />
      </div>

      <ReceiptTicket order={ticketData} />

      <div className="no-print" style={{ maxWidth: "340px", margin: "16px auto 0", display: "flex", flexDirection: "column", gap: "10px" }}>
        {whatsappLink && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textAlign: "center", padding: "10px 14px", fontSize: "13px", fontWeight: "700", backgroundColor: "#16A34A", color: "white", borderRadius: "8px", textDecoration: "none" }}
          >
            Enviar por WhatsApp
          </a>
        )}

        {canVoid && <VoidSaleButton orderId={order.id} />}
        {alreadyClosed && (
          <p style={{ fontSize: "12px", color: "#A3A3A3", textAlign: "center" }}>
            La caja de este turno ya esta cerrada, no se puede anular desde aca.
          </p>
        )}
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
