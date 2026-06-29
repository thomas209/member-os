import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{display:"flex",minHeight:"100vh"}}>
      <aside style={{width:"240px",backgroundColor:"#0A0A0A",color:"white",display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"24px",borderBottom:"1px solid #262626"}}>
          <p style={{fontSize:"11px",letterSpacing:"0.15em",textTransform:"uppercase",color:"#737373",marginBottom:"4px"}}>Member OS</p>
          <p style={{fontSize:"13px",fontWeight:"600",color:"white"}}>Backoffice</p>
        </div>
        <nav style={{padding:"16px",flex:1}}>
          <p style={{fontSize:"10px",letterSpacing:"0.12em",textTransform:"uppercase",color:"#525252",marginBottom:"8px",paddingLeft:"12px"}}>Ventas</p>
          {[
            {href:"/admin/orders",label:"Pedidos"},
            {href:"/admin/customers",label:"Clientes"},
          ].map((item) => (
            <a key={item.href} href={item.href} style={{display:"block",padding:"10px 12px",fontSize:"13px",color:"#A3A3A3",textDecoration:"none",marginBottom:"2px"}}>
              {item.label}
            </a>
          ))}
          <p style={{fontSize:"10px",letterSpacing:"0.12em",textTransform:"uppercase",color:"#525252",marginBottom:"8px",paddingLeft:"12px",marginTop:"16px"}}>Catalogo</p>
          {[
            {href:"/admin/products",label:"Productos"},
            {href:"/admin/brands",label:"Marcas"},
            {href:"/admin/categories",label:"Categorias"},
            {href:"/admin/stock",label:"Stock"},
          ].map((item) => (
            <a key={item.href} href={item.href} style={{display:"block",padding:"10px 12px",fontSize:"13px",color:"#A3A3A3",textDecoration:"none",marginBottom:"2px"}}>
              {item.label}
            </a>
          ))}
        </nav>
        <div style={{padding:"16px",borderTop:"1px solid #262626"}}>
          <a href="/" style={{fontSize:"12px",color:"#737373",textDecoration:"none"}}>← Ver tienda</a>
        </div>
      </aside>
      <main style={{flex:1,backgroundColor:"#F4F4F4",overflowY:"auto"}}>
        {children}
      </main>
    </div>
  );
}
