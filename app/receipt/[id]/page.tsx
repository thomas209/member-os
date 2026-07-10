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
    <div style={{ padding: "24px", backgroundColor: "#F4F4F4", minHeight: "100vh" }}>
      <div className="no-print" style={{ maxWidth: "340px", margin: "0 auto 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "13px", fontWeight: "700" }}>Member Club</span>
        <PrintButton />
      </div>

      <ReceiptTicket order={ticketData} />

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
