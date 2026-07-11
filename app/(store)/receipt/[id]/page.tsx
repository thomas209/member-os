export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PrintButton from "@/components/pos/PrintButton";
import ReceiptTicket from "@/components/pos/ReceiptTicket";

export default async function PublicReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) notFound();

  const ticketData = {
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    paymentMethod: order.paymentMethod,
    subtotal: Number(order.subtotal),
    discountAmount: Number(order.discountAmount),
    shippingCost: Number(order.shippingCost),
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

  return (
    <div style={{ padding: "56px 24px", backgroundColor: "#FAFAFA", minHeight: "70vh" }}>
      <div style={{ maxWidth: "380px", margin: "0 auto" }}>
        <div className="no-print" style={{ textAlign: "center", marginBottom: "24px" }}>
          <p style={{ fontSize: "12px", color: "#A3A3A3", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>
            Comprobante de compra
          </p>
          <h1 style={{ fontFamily: "Georgia, serif", fontWeight: "400", fontSize: "26px", color: "#0A0A0A" }}>
            ¡Gracias por tu compra!
          </h1>
        </div>

        <ReceiptTicket order={ticketData} />

        <div className="no-print" style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "20px" }}>
          <a
            href="/catalog"
            style={{
              display: "block",
              width: "100%",
              boxSizing: "border-box",
              textAlign: "center",
              padding: "16px",
              fontSize: "13px",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              backgroundColor: "#0A0A0A",
              color: "white",
              borderRadius: 0,
              textDecoration: "none",
            }}
          >
            Seguir viendo el catálogo
          </a>
          <PrintButton variant="store" />
        </div>
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
