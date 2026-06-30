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

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div style={{padding:"48px"}}>
      <div style={{marginBottom:"32px"}}>
        <h1 style={{fontSize:"24px",fontWeight:"700",letterSpacing:"-0.02em",marginBottom:"4px"}}>Pedidos</h1>
        <p style={{fontSize:"13px",color:"#737373"}}>{orders.length} pedidos en total</p>
      </div>
      <div style={{backgroundColor:"white",border:"1px solid #E8E8E8"}}>
        {orders.map((order) => (
          <div key={order.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 24px",borderBottom:"1px solid #F4F4F4"}}>
            <div style={{display:"flex",alignItems:"center",gap:"24px",flex:1}}>
              <p style={{fontSize:"13px",fontWeight:"700",fontFamily:"monospace",width:"60px",flexShrink:0}}>
                #{String(order.orderNumber).padStart(4,"0")}
              </p>
              <div style={{flex:1}}>
                <p style={{fontSize:"13px",fontWeight:"500"}}>{order.guestFirstName} {order.guestLastName}</p>
                <p style={{fontSize:"11px",color:"#737373"}}>{order.guestEmail}</p>
              </div>
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
              <p style={{fontSize:"12px",color:"#737373",flexShrink:0}}>
                {new Date(order.createdAt).toLocaleDateString("es-AR")}
              </p>
            </div>
            <a
              href={"/admin/orders/" + order.id}
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
