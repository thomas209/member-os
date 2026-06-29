import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import OrderActions from "./OrderActions";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  PROCESSING: "En proceso",
  SHIPPED: "Despachado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#D97706",
  PAID: "#16A34A",
  PROCESSING: "#2563EB",
  SHIPPED: "#7C3AED",
  DELIVERED: "#16A34A",
  CANCELLED: "#DC2626",
  REFUNDED: "#737373",
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
        },
      },
    },
  });

  if (!order) notFound();

  const address = order.shippingAddress as any;

  return (
    <div style={{padding:"48px",maxWidth:"1000px"}}>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"40px"}}>
        <div>
          <a href="/dashboard/orders" style={{fontSize:"12px",color:"#737373",textDecoration:"none",letterSpacing:"0.06em",textTransform:"uppercase"}}>
            ← Volver a pedidos
          </a>
          <h1 style={{fontSize:"28px",fontWeight:"700",letterSpacing:"-0.02em",marginTop:"12px",marginBottom:"4px"}}>
            Pedido #{String(order.orderNumber).padStart(4,"0")}
          </h1>
          <span style={{
            fontSize:"11px",fontWeight:"600",letterSpacing:"0.06em",textTransform:"uppercase",
            color:STATUS_COLORS[order.status],
            backgroundColor:STATUS_COLORS[order.status] + "20",
            padding:"4px 10px",
          }}>
            {STATUS_LABELS[order.status]}
          </span>
        </div>
        <p style={{fontSize:"12px",color:"#737373"}}>
          {new Date(order.createdAt).toLocaleDateString("es-AR", {day:"numeric",month:"long",year:"numeric"})}
        </p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:"32px"}}>
        <div>

          {/* Productos */}
          <div style={{backgroundColor:"white",border:"1px solid #E8E8E8",padding:"24px",marginBottom:"24px"}}>
            <h2 style={{fontSize:"12px",fontWeight:"600",letterSpacing:"0.1em",textTransform:"uppercase",color:"#737373",marginBottom:"20px"}}>Productos</h2>
            <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
              {order.items.map((item) => (
                <div key={item.id} style={{display:"flex",gap:"16px",alignItems:"center"}}>
                  <div style={{width:"64px",height:"80px",backgroundColor:"#F4F4F4",flexShrink:0,overflow:"hidden"}}>
                    {item.product.images[0] ? (
                      <img src={item.product.images[0].url} alt={item.productName} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                    ) : (
                      <div style={{width:"100%",height:"100%",backgroundColor:"#E8E8E8"}} />
                    )}
                  </div>
                  <div style={{flex:1}}>
                    <p style={{fontSize:"13px",fontWeight:"600",marginBottom:"2px"}}>{item.productName}</p>
                    <p style={{fontSize:"12px",color:"#737373",marginBottom:"2px"}}>{item.productBrand}</p>
                    <p style={{fontSize:"12px",color:"#737373"}}>Talle {item.size} x {item.quantity}</p>
                  </div>
                  <p style={{fontSize:"14px",fontWeight:"700"}}>${Number(item.unitPrice * item.quantity).toLocaleString("es-AR")}</p>
                </div>
              ))}
            </div>
            <div style={{borderTop:"1px solid #E8E8E8",marginTop:"20px",paddingTop:"16px",display:"flex",justifyContent:"space-between"}}>
              <p style={{fontSize:"13px",color:"#737373"}}>Total</p>
              <p style={{fontSize:"16px",fontWeight:"700"}}>${Number(order.total).toLocaleString("es-AR")}</p>
            </div>
          </div>

          {/* Acciones */}
          <OrderActions orderId={order.id} currentStatus={order.status} trackingNumber={order.trackingNumber} />

        </div>

        <div>
          {/* Cliente */}
          <div style={{backgroundColor:"white",border:"1px solid #E8E8E8",padding:"24px",marginBottom:"16px"}}>
            <h2 style={{fontSize:"12px",fontWeight:"600",letterSpacing:"0.1em",textTransform:"uppercase",color:"#737373",marginBottom:"16px"}}>Cliente</h2>
            <p style={{fontSize:"14px",fontWeight:"600",marginBottom:"4px"}}>{order.guestFirstName} {order.guestLastName}</p>
            <p style={{fontSize:"13px",color:"#737373",marginBottom:"4px"}}>{order.guestEmail}</p>
            <p style={{fontSize:"13px",color:"#737373"}}>{order.guestPhone}</p>
          </div>

          {/* Direccion */}
          <div style={{backgroundColor:"white",border:"1px solid #E8E8E8",padding:"24px"}}>
            <h2 style={{fontSize:"12px",fontWeight:"600",letterSpacing:"0.1em",textTransform:"uppercase",color:"#737373",marginBottom:"16px"}}>Direccion de envio</h2>
            <p style={{fontSize:"13px",lineHeight:"1.8",color:"#525252"}}>
              {address?.street} {address?.number} {address?.floor && "- " + address.floor}<br/>
              {address?.city}, {address?.province}<br/>
              CP {address?.postalCode}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
