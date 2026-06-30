export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import DeleteProductButton from "./DeleteProductButton";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    include: {
      brand: { select: { name: true } },
      category: { select: { name: true } },
      variants: { select: { stock: true } },
      images: { where: { isPrimary: true }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div style={{padding:"48px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"32px"}}>
        <div>
          <h1 style={{fontSize:"24px",fontWeight:"700",letterSpacing:"-0.02em",marginBottom:"4px"}}>Productos</h1>
          <p style={{fontSize:"13px",color:"#737373"}}>{products.length} productos en total</p>
        </div>
        <a href="/admin/products/new" style={{padding:"12px 24px",backgroundColor:"#0A0A0A",color:"white",fontSize:"12px",fontWeight:"600",letterSpacing:"0.08em",textTransform:"uppercase",textDecoration:"none"}}>
          + Nuevo producto
        </a>
      </div>

      <div style={{backgroundColor:"white",border:"1px solid #E8E8E8"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{borderBottom:"1px solid #E8E8E8"}}>
              {["Producto","Marca","Categoria","Stock","Precio","Estado",""].map((h) => (
                <th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:"11px",fontWeight:"600",letterSpacing:"0.08em",textTransform:"uppercase",color:"#737373"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0);
              return (
                <tr key={product.id} style={{borderBottom:"1px solid #F4F4F4"}}>
                  <td style={{padding:"16px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                      <div style={{width:"48px",height:"60px",backgroundColor:"#F4F4F4",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                        {product.images[0] ? (
                          <img src={product.images[0].url} alt={product.name} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                        ) : (
                          <span style={{fontSize:"9px",color:"#A3A3A3"}}>IMG</span>
                        )}
                      </div>
                      <div>
                        <p style={{fontSize:"13px",fontWeight:"500"}}>{product.name}</p>
                        {product.colorName && <p style={{fontSize:"11px",color:"#737373"}}>{product.colorName}</p>}
                      </div>
                    </div>
                  </td>
                  <td style={{padding:"16px",fontSize:"13px",color:"#737373"}}>{product.brand.name}</td>
                  <td style={{padding:"16px",fontSize:"13px",color:"#737373"}}>{product.category.name}</td>
                  <td style={{padding:"16px"}}>
                    <span style={{fontSize:"12px",fontWeight:"600",color:totalStock===0?"#DC2626":totalStock<=3?"#D97706":"#16A34A"}}>
                      {totalStock} u.
                    </span>
                  </td>
                  <td style={{padding:"16px",fontSize:"13px",fontWeight:"700"}}>${Number(product.price).toLocaleString("es-AR")}</td>
                  <td style={{padding:"16px"}}>
                    <span style={{fontSize:"11px",fontWeight:"600",letterSpacing:"0.06em",textTransform:"uppercase",color:product.isActive?"#16A34A":"#737373",backgroundColor:product.isActive?"#DCFCE7":"#F4F4F4",padding:"4px 8px"}}>
                      {product.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td style={{padding:"16px"}}>
                    <div style={{display:"flex",gap:"8px"}}>
                      <a href={"/admin/products/" + product.id + "/edit"} style={{fontSize:"11px",fontWeight:"600",letterSpacing:"0.08em",textTransform:"uppercase",color:"#0A0A0A",textDecoration:"none",border:"1px solid #0A0A0A",padding:"8px 16px",backgroundColor:"white"}}>
                        Editar
                      </a>
                      <DeleteProductButton id={product.id} name={product.name} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
