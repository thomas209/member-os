export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export default async function SuccessPage({ searchParams }: { searchParams: any }) {
  const orderId = searchParams.orderId;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    return (
      <div style={{maxWidth:"600px",margin:"80px auto",textAlign:"center",padding:"48px"}}>
        <p style={{fontSize:"16px",color:"#737373"}}>Orden no encontrada</p>
      </div>
    );
  }

  return (
    <div style={{maxWidth:"600px",margin:"80px auto",padding:"48px"}}>
      <div style={{textAlign:"center",marginBottom:"48px"}}>
        <div style={{width:"64px",height:"64px",backgroundColor:"#DCFCE7",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px"}}>
          <span style={{fontSize:"28px"}}>✓</span>
        </div>
        <h1 style={{fontSize:"24px",fontWeight:"700",letterSpacing:"-0.02em",marginBottom:"8px"}}>
          Pedido confirmado
        </h1>
        <p style={{fontSize:"14px",color:"#737373"}}>
          Gracias {order.guestFirstName}. Tu pedido fue recibido.
        </p>
      </div>

      <div style={{backgroundColor:"#FAFAFA",padding:"24px",marginBottom:"24px"}}>
        <p style={{fontSize:"11px",fontWeight:"600",letterSpacing:"0.1em",textTransform:"uppercase",color:"#737373",marginBottom:"8px"}}>Numero de pedido</p>
        <p style={{fontSize:"24px",fontWeight:"700",fontFamily:"monospace"}}>#{String(order.orderNumber).padStart(4,"0")}</p>
      </div>

      <div style={{marginBottom:"24px",paddingBottom:"24px",borderBottom:"1px solid #E8E8E8"}}>
        <p style={{fontSize:"11px",fontWeight:"600",letterSpacing:"0.1em",textTransform:"uppercase",color:"#737373",marginBottom:"16px"}}>Productos</p>
        {order.items.map((item) => (
          <div key={item.id} style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}>
            <p style={{fontSize:"14px"}}>{item.productName} — Talle {item.size}</p>
            <p style={{fontSize:"14px",fontWeight:"600"}}>${Number(item.unitPrice).toLocaleString("es-AR")}</p>
          </div>
        ))}
      </div>

      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"40px"}}>
        <p style={{fontSize:"14px",color:"#737373"}}>Total pagado</p>
        <p style={{fontSize:"18px",fontWeight:"700"}}>${Number(order.total).toLocaleString("es-AR")}</p>
      </div>

      <div style={{backgroundColor:"#F4F4F4",padding:"24px",marginBottom:"32px"}}>
        <p style={{fontSize:"13px",color:"#525252",lineHeight:"1.6"}}>
          Te avisaremos por email cuando tu pedido sea despachado. 
          Cualquier consulta escribinos con tu numero de pedido.
        </p>
      </div>

      <a href="/" style={{display:"block",textAlign:"center",padding:"16px",backgroundColor:"#0A0A0A",color:"white",fontSize:"13px",fontWeight:"600",letterSpacing:"0.1em",textTransform:"uppercase",textDecoration:"none"}}>
        Volver al inicio
      </a>
    </div>
  );
}
