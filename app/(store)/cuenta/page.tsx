import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/customerAuth";
import LogoutButton from "@/components/store/LogoutButton";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  PAID: "Pago",
  PROCESSING: "En preparación",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#A3A3A3",
  PAID: "#16A34A",
  PROCESSING: "#0A0A0A",
  SHIPPED: "#0A0A0A",
  DELIVERED: "#16A34A",
  CANCELLED: "#DC2626",
  REFUNDED: "#DC2626",
};

export default async function AccountPage() {
  const customer = await getCurrentCustomer();
  if (!customer) {
    redirect("/cuenta/ingresar");
  }

  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    include: { items: { select: { isEncargo: true, shippedAt: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "8px", paddingBottom: "16px", borderBottom: "1px solid #E8E8E8" }}>
        <div>
          <h1 style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Mi cuenta
          </h1>
          <p style={{ fontSize: "13px", color: "#737373", marginTop: "4px" }}>{customer.email}</p>
        </div>
        <LogoutButton />
      </div>

      <h2 style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#737373", margin: "32px 0 16px" }}>
        Mis pedidos
      </h2>

      {orders.length === 0 ? (
        <p style={{ fontSize: "14px", color: "#737373" }}>Todavía no hiciste ningún pedido.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {orders.map((order) => (
            <a
              key={order.id}
              href={"/receipt/" + order.id}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "20px 0", borderBottom: "1px solid #F4F4F4", textDecoration: "none", color: "#0A0A0A",
              }}
            >
              <div>
                <p style={{ fontSize: "14px", fontWeight: 600 }}>
                  Pedido #{String(order.orderNumber).padStart(4, "0")}
                </p>
                <p style={{ fontSize: "12px", color: "#737373", marginTop: "4px" }}>
                  {new Date(order.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
                {order.items.some((i) => i.isEncargo) && (
                  <p style={{ fontSize: "11px", color: "#A3A3A3", marginTop: "4px" }}>Incluye producto por encargo</p>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "14px", fontWeight: 700 }}>
                  ${Number(order.total).toLocaleString("es-AR")}
                </p>
                <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: STATUS_COLORS[order.status] || "#737373", marginTop: "4px" }}>
                  {order.status === "PROCESSING" && order.items.some((i) => i.shippedAt)
                    ? "Despachado " + order.items.filter((i) => i.shippedAt).length + "/" + order.items.length
                    : STATUS_LABELS[order.status] || order.status}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
