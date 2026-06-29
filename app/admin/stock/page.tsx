import { prisma } from "@/lib/prisma";

export default async function StockPage() {
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    include: {
      brand: { select: { name: true } },
      variants: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const movements = await prisma.stockMovement.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      variant: {
        include: { product: { select: { name: true } } },
      },
    },
  });

  return (
    <div style={{padding:"48px"}}>
      <div style={{marginBottom:"32px"}}>
        <h1 style={{fontSize:"24px",fontWeight:"700",letterSpacing:"-0.02em",marginBottom:"4px"}}>Stock</h1>
        <p style={{fontSize:"13px",color:"#737373"}}>Inventario actual y movimientos recientes</p>
      </div>

      {/* INVENTARIO */}
      <h2 style={{fontSize:"13px",fontWeight:"600",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"16px",color:"#737373"}}>Inventario actual</h2>
      <div style={{backgroundColor:"white",border:"1px solid #E8E8E8",marginBottom:"48px"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{borderBottom:"1px solid #E8E8E8"}}>
              {["Producto","Marca","Talle","Stock","Estado"].map((h) => (
                <th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:"11px",fontWeight:"600",letterSpacing:"0.08em",textTransform:"uppercase",color:"#737373"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.flatMap((product) =>
              product.variants.map((variant) => (
                <tr key={variant.id} style={{borderBottom:"1px solid #F4F4F4"}}>
                  <td style={{padding:"12px 16px",fontSize:"13px",fontWeight:"500"}}>{product.name}</td>
                  <td style={{padding:"12px 16px",fontSize:"13px",color:"#737373"}}>{product.brand.name}</td>
                  <td style={{padding:"12px 16px",fontSize:"13px",fontFamily:"monospace",fontWeight:"600"}}>T{variant.size}</td>
                  <td style={{padding:"12px 16px"}}>
                    <span style={{fontSize:"13px",fontWeight:"700",color:variant.stock === 0 ? "#DC2626" : variant.stock <= 3 ? "#D97706" : "#16A34A"}}>
                      {variant.stock} u.
                    </span>
                  </td>
                  <td style={{padding:"12px 16px"}}>
                    <span style={{fontSize:"11px",fontWeight:"600",letterSpacing:"0.06em",textTransform:"uppercase",
                      color:variant.stock === 0 ? "#DC2626" : variant.stock <= 3 ? "#D97706" : "#16A34A",
                      backgroundColor:variant.stock === 0 ? "#FEE2E2" : variant.stock <= 3 ? "#FEF3C7" : "#DCFCE7",
                      padding:"3px 8px"}}>
                      {variant.stock === 0 ? "Sin stock" : variant.stock <= 3 ? "Stock bajo" : "OK"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MOVIMIENTOS RECIENTES */}
      <h2 style={{fontSize:"13px",fontWeight:"600",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"16px",color:"#737373"}}>Ultimos movimientos</h2>
      <div style={{backgroundColor:"white",border:"1px solid #E8E8E8"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{borderBottom:"1px solid #E8E8E8"}}>
              {["Producto","Talle","Tipo","Cantidad","Stock anterior","Stock nuevo","Fecha"].map((h) => (
                <th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:"11px",fontWeight:"600",letterSpacing:"0.08em",textTransform:"uppercase",color:"#737373"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => (
              <tr key={m.id} style={{borderBottom:"1px solid #F4F4F4"}}>
                <td style={{padding:"12px 16px",fontSize:"13px",fontWeight:"500"}}>{m.variant.product.name}</td>
                <td style={{padding:"12px 16px",fontSize:"13px",fontFamily:"monospace"}}>T{m.variant.size}</td>
                <td style={{padding:"12px 16px"}}>
                  <span style={{fontSize:"11px",fontWeight:"600",letterSpacing:"0.06em",textTransform:"uppercase",
                    color: m.type === "PURCHASE" ? "#DC2626" : m.type === "RESTOCK" ? "#16A34A" : "#2563EB",
                    backgroundColor: m.type === "PURCHASE" ? "#FEE2E2" : m.type === "RESTOCK" ? "#DCFCE7" : "#DBEAFE",
                    padding:"3px 8px"}}>
                    {m.type}
                  </span>
                </td>
                <td style={{padding:"12px 16px",fontSize:"13px",fontWeight:"600",color: m.quantity < 0 ? "#DC2626" : "#16A34A"}}>
                  {m.quantity > 0 ? "+" : ""}{m.quantity}
                </td>
                <td style={{padding:"12px 16px",fontSize:"13px",color:"#737373"}}>{m.previousStock}</td>
                <td style={{padding:"12px 16px",fontSize:"13px",fontWeight:"600"}}>{m.newStock}</td>
                <td style={{padding:"12px 16px",fontSize:"12px",color:"#737373"}}>{new Date(m.createdAt).toLocaleDateString("es-AR")}</td>
              </tr>
            ))}
            {movements.length === 0 && (
              <tr>
                <td colSpan={7} style={{padding:"48px",textAlign:"center",fontSize:"14px",color:"#737373"}}>No hay movimientos todavia</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
