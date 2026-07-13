import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { COUNTED_ORDER_STATUSES } from "@/lib/customerCrm";
import { buildWhatsappLink } from "@/lib/whatsapp";
import CustomerCrmPanel from "./CustomerCrmPanel";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  PROCESSING: "Procesando",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: { items: { select: { size: true, quantity: true } } },
      },
    },
  });

  if (!customer) notFound();

  const countedOrders = customer.orders.filter((o) => (COUNTED_ORDER_STATUSES as readonly string[]).includes(o.status));
  const totalSpent = countedOrders.reduce((acc, o) => acc + Number(o.total), 0);

  const sizeCounts = new Map<string, number>();
  for (const order of countedOrders) {
    for (const item of order.items) {
      sizeCounts.set(item.size, (sizeCounts.get(item.size) || 0) + item.quantity);
    }
  }
  const favoriteSizes = Array.from(sizeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const fullName = (customer.firstName + " " + customer.lastName).trim() || "(sin nombre)";
  const whatsappLink = customer.phone
    ? buildWhatsappLink(customer.phone, "Hola " + (customer.firstName || "") + "! Te escribo de Member Club.")
    : null;

  return (
    <div style={{ padding: "48px", maxWidth: "980px" }}>
      <Link href="/admin/customers" style={{ fontSize: "12px", color: "#737373", textDecoration: "none" }}>
        ← Volver a clientes
      </Link>

      <div style={{ marginTop: "12px", marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "4px" }}>{fullName}</h1>
          <p style={{ fontSize: "13px", color: "#737373" }}>{customer.email}</p>
        </div>
        {whatsappLink && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: "10px 18px", fontSize: "12px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", border: "1px solid #16A34A", color: "#16A34A", textDecoration: "none" }}
          >
            WhatsApp: {customer.phone}
          </a>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px" }}>
        <div style={{ backgroundColor: "white", border: "1px solid #E8E8E8", padding: "20px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#737373", marginBottom: "8px" }}>Pedidos</p>
          <p style={{ fontSize: "22px", fontWeight: 700 }}>{countedOrders.length}</p>
        </div>
        <div style={{ backgroundColor: "white", border: "1px solid #E8E8E8", padding: "20px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#737373", marginBottom: "8px" }}>Total gastado</p>
          <p style={{ fontSize: "22px", fontWeight: 700 }}>${totalSpent.toLocaleString("es-AR")}</p>
        </div>
        <div style={{ backgroundColor: "white", border: "1px solid #E8E8E8", padding: "20px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#737373", marginBottom: "8px" }}>Talles favoritos</p>
          <p style={{ fontSize: "14px", fontWeight: 600 }}>
            {favoriteSizes.length === 0 ? "-" : favoriteSizes.map(([size, count]) => size + " (" + count + ")").join(", ")}
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "24px", alignItems: "start" }}>
        <div style={{ backgroundColor: "white", border: "1px solid #E8E8E8" }}>
          <h2 style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "20px 20px 0" }}>Historial de pedidos</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "12px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #E8E8E8" }}>
                {["Pedido", "Fecha", "Canal", "Estado", "Total"].map((h) => (
                  <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#737373" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customer.orders.map((order) => (
                <tr key={order.id} style={{ borderBottom: "1px solid #F4F4F4" }}>
                  <td style={{ padding: "14px 20px", fontSize: "13px", fontWeight: 500 }}>
                    <Link href={"/admin/orders/" + order.id} style={{ color: "#0A0A0A" }}>
                      #{order.orderNumber}
                    </Link>
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: "13px", color: "#737373" }}>
                    {new Date(order.createdAt).toLocaleDateString("es-AR")}
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: "12px", color: "#737373" }}>{order.channel === "POS" ? "Local" : "Online"}</td>
                  <td style={{ padding: "14px 20px", fontSize: "12px" }}>{STATUS_LABELS[order.status] || order.status}</td>
                  <td style={{ padding: "14px 20px", fontSize: "13px", fontWeight: 700 }}>${Number(order.total).toLocaleString("es-AR")}</td>
                </tr>
              ))}
              {customer.orders.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: "32px 20px", textAlign: "center", fontSize: "13px", color: "#737373" }}>
                    Sin pedidos todavia
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <CustomerCrmPanel customerId={customer.id} initialNotes={customer.notes || ""} initialTags={customer.tags} />
      </div>
    </div>
  );
}
