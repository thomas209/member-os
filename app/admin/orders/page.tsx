export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente", PAID: "Pagado", PROCESSING: "En proceso",
  SHIPPED: "Despachado", DELIVERED: "Entregado", CANCELLED: "Cancelado", REFUNDED: "Reembolsado",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#D97706", PAID: "#16A34A", PROCESSING: "#2563EB",
  SHIPPED: "#7C3AED", DELIVERED: "#16A34A", CANCELLED: "#DC2626", REFUNDED: "#737373",
};

const CHANNEL_LABELS: Record<string, string> = { POS: "Local", ONLINE: "Online" };
const CHANNEL_COLORS: Record<string, string> = { POS: "#7C3AED", ONLINE: "#2563EB" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ channel?: string }> }) {
  const { channel } = await searchParams;
  const activeChannel = channel === "POS" || channel === "ONLINE" ? channel : undefined;

  const orders = await prisma.order.findMany({
    where: activeChannel ? { channel: activeChannel } : undefined,
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const filters = [
    { label: "Todos", href: "/admin/orders", active: !activeChannel },
    { label: "Online", href: "/admin/orders?channel=ONLINE", active: activeChannel === "ONLINE" },
    { label: "Local", href: "/admin/orders?channel=POS", active: activeChannel === "POS" },
  ];

  return (
    <div style={{padding:"48px"}}>
      <div style={{marginBottom:"24px"}}>
        <h1 style={{fontSize:"24px",fontWeight:"700",letterSpacing:"-0.02em",marginBottom:"4px"}}>Pedidos</h1>
        <p style={{fontSize:"13px",color:"#737373"}}>{orders.length} pedidos {activeChannel ? "(" + CHANNEL_LABELS[activeChannel].toLowerCase() + ")" : "en total"}</p>
      </div>

      <div style={{display:"flex",gap:"8px",marginBottom:"20px"}}>
        {filters.map((f) => (
          <a
            key={f.label}
            href={f.href}
            style={{
              fontSize:"12px",fontWeight:"600",padding:"8px 16px",textDecoration:"none",
              borderRadius:"8px",border: f.active ? "1px solid #0A0A0A" : "1px solid #E8E8E8",
              backgroundColor: f.active ? "#0A0A0A" : "white",
              color: f.active ? "white" : "#737373",
            }}
          >
            {f.label}
          </a>
        ))}
      </div>

      <div style={{backgroundColor:"white",border:"1px solid #E8E8E8"}}>
        {orders.map((order) => (
          <div key={order.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 24px",borderBottom:"1px solid #F4F4F4"}}>
            <div style={{display:"flex",alignItems:"center",gap:"24px",flex:1}}>
              <p style={{fontSize:"13px",fontWeight:"700",fontFamily:"monospace",width:"60px",flexShrink:0}}>
                #{String(order.orderNumber).padStart(4,"0")}
              </p>
              <div style={{flex:1}}>
                <p style={{fontSize:"13px",fontWeight:"500"}}>
                  {order.guestFirstName ? order.guestFirstName + " " + order.guestLastName : "Venta en local"}
                </p>
                <p style={{fontSize:"11px",color:"#737373"}}>{order.guestEmail || "—"}</p>
              </div>
              <span style={{
                fontSize:"11px",fontWeight:"600",letterSpacing:"0.06em",textTransform:"uppercase",
                color:CHANNEL_COLORS[order.channel] || "#737373",
                backgroundColor:(CHANNEL_COLORS[order.channel] || "#737373") + "20",
                padding:"4px 10px",flexShrink:0,
              }}>
                {CHANNEL_LABELS[order.channel] || order.channel}
              </span>
              <p style={{fontSize:"13px",fontWeight:"700",width:"100px",flexShrink:0}}>
                ${Number(order.total).toLocaleString("es-AR")}
              </p>
              <span style={{
                fontSize:"11px",fontWeight:"600",letterSpacing:"0.06em",textTransform:"uppercase",
                color:STATUS_COLORS[order.status],
                backgroundColor:STATUS_COLORS[order.status] + "20",
                padding:"4px 10px",flexShrink:0,
              }}>
                {STATUS_LABELS[order.status]}
              </span>
              {order.paymentMethod === "TRANSFERENCIA" && order.status === "PENDING" && (
                <span style={{
                  fontSize:"11px",fontWeight:"600",letterSpacing:"0.06em",textTransform:"uppercase",
                  color:"#92400E", backgroundColor:"#FEF3C7", padding:"4px 10px",flexShrink:0,
                }}>
                  Transferencia
                </span>
              )}
              <p style={{fontSize:"12px",color:"#737373",flexShrink:0}}>
                {new Date(order.createdAt).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}
              </p>
            </div>
            <a
              href={order.channel === "POS" ? "/admin/pos/receipt/" + order.id : "/admin/orders/" + order.id}
              style={{
                fontSize:"12px",fontWeight:"600",letterSpacing:"0.06em",
                textTransform:"uppercase",textDecoration:"none",
                color:"#0A0A0A",border:"1px solid #0A0A0A",
                padding:"8px 16px",whiteSpace:"nowrap",flexShrink:0,marginLeft:"24px"
              }}
            >
              Ver pedido
            </a>
          </div>
        ))}
        {orders.length === 0 && (
          <div style={{padding:"48px",textAlign:"center",fontSize:"14px",color:"#737373"}}>
            No hay pedidos todavia
          </div>
        )}
      </div>
    </div>
  );
}
