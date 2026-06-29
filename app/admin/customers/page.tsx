import { prisma } from "@/lib/prisma";

export default async function CustomersPage() {
  const customers = await prisma.order.groupBy({
    by: ["guestEmail", "guestFirstName", "guestLastName"],
    _count: { id: true },
    _sum: { total: true },
    orderBy: { _count: { id: "desc" } },
  });

  return (
    <div style={{padding:"48px"}}>
      <div style={{marginBottom:"32px"}}>
        <h1 style={{fontSize:"24px",fontWeight:"700",letterSpacing:"-0.02em",marginBottom:"4px"}}>Clientes</h1>
        <p style={{fontSize:"13px",color:"#737373"}}>{customers.length} clientes en total</p>
      </div>
      <div style={{backgroundColor:"white",border:"1px solid #E8E8E8"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{borderBottom:"1px solid #E8E8E8"}}>
              {["Cliente","Email","Pedidos","Total gastado"].map((h) => (
                <th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:"11px",fontWeight:"600",letterSpacing:"0.08em",textTransform:"uppercase",color:"#737373"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {customers.map((c, i) => (
              <tr key={i} style={{borderBottom:"1px solid #F4F4F4"}}>
                <td style={{padding:"16px",fontSize:"13px",fontWeight:"500"}}>{c.guestFirstName} {c.guestLastName}</td>
                <td style={{padding:"16px",fontSize:"13px",color:"#737373"}}>{c.guestEmail}</td>
                <td style={{padding:"16px",fontSize:"13px",fontWeight:"600"}}>{c._count.id}</td>
                <td style={{padding:"16px",fontSize:"13px",fontWeight:"700"}}>${Number(c._sum.total || 0).toLocaleString("es-AR")}</td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={4} style={{padding:"48px",textAlign:"center",fontSize:"14px",color:"#737373"}}>No hay clientes todavia</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
