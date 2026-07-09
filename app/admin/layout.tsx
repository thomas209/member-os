"use client";
import { useState } from "react";

const salesLinks = [
  { href: "/admin/orders", label: "Pedidos" },
  { href: "/admin/customers", label: "Clientes" },
];

const posLinks = [
  { href: "/admin/pos", label: "Escanear" },
  { href: "/admin/labels", label: "Etiquetas" },
];

const catalogLinks = [
  { href: "/admin/products", label: "Productos" },
  { href: "/admin/brands", label: "Marcas" },
  { href: "/admin/categories", label: "Categorias" },
  { href: "/admin/stock", label: "Stock" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const NavContent = () => (
    <>
      <div style={{padding:"24px",borderBottom:"1px solid #262626"}}>
        <p style={{fontSize:"11px",letterSpacing:"0.15em",textTransform:"uppercase",color:"#737373",marginBottom:"4px"}}>Member OS</p>
        <p style={{fontSize:"13px",fontWeight:"600",color:"white"}}>Backoffice</p>
      </div>
      <nav style={{padding:"16px",flex:1}}>
        <p style={{fontSize:"10px",letterSpacing:"0.12em",textTransform:"uppercase",color:"#525252",marginBottom:"8px",paddingLeft:"12px"}}>Ventas</p>
        {salesLinks.map((item) => (
          <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)} style={{display:"block",padding:"10px 12px",fontSize:"13px",color:"#A3A3A3",textDecoration:"none",marginBottom:"2px"}}>
            {item.label}
          </a>
        ))}
        <p style={{fontSize:"10px",letterSpacing:"0.12em",textTransform:"uppercase",color:"#525252",marginBottom:"8px",paddingLeft:"12px",marginTop:"16px"}}>Catalogo</p>
        {catalogLinks.map((item) => (
          <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)} style={{display:"block",padding:"10px 12px",fontSize:"13px",color:"#A3A3A3",textDecoration:"none",marginBottom:"2px"}}>
            {item.label}
          </a>
        ))}
        <p style={{fontSize:"10px",letterSpacing:"0.12em",textTransform:"uppercase",color:"#525252",marginBottom:"8px",paddingLeft:"12px",marginTop:"16px"}}>Punto de Venta</p>
        {posLinks.map((item) => (
          <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)} style={{display:"block",padding:"10px 12px",fontSize:"13px",color:"#A3A3A3",textDecoration:"none",marginBottom:"2px"}}>
            {item.label}
          </a>
        ))}
      </nav>
      <div style={{padding:"16px",borderTop:"1px solid #262626"}}>
        <a href="/" style={{fontSize:"12px",color:"#737373",textDecoration:"none"}}>← Ver tienda</a>
      </div>
    </>
  );

  return (
    <div className="admin-root" style={{display:"flex",minHeight:"100vh"}}>

      {/* SIDEBAR DESKTOP — igual que antes, sin cambios */}
      <aside className="admin-sidebar-desktop" style={{width:"240px",backgroundColor:"#0A0A0A",color:"white",display:"flex",flexDirection:"column",flexShrink:0}}>
        <NavContent />
      </aside>

      {/* TOPBAR MOBILE */}
      <div className="admin-topbar-mobile" style={{display:"none",position:"sticky",top:0,zIndex:40,backgroundColor:"#0A0A0A",color:"white",padding:"14px 16px",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #262626"}}>
        <p style={{fontSize:"13px",fontWeight:"600"}}>Member OS Backoffice</p>
        <button onClick={() => setMenuOpen(true)} style={{background:"none",border:"none",cursor:"pointer",padding:"4px"}} aria-label="Abrir menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>

      {/* OVERLAY + DRAWER MOBILE */}
      {menuOpen && (
        <div className="admin-menu-overlay" onClick={() => setMenuOpen(false)} style={{position:"fixed",inset:0,backgroundColor:"rgba(0,0,0,0.4)",zIndex:50}} />
      )}
      <div
        className="admin-drawer-mobile"
        style={{
          position:"fixed",top:0,left:0,height:"100%",width:"260px",
          backgroundColor:"#0A0A0A",zIndex:60,display:"flex",flexDirection:"column",
          transform: menuOpen ? "translateX(0)" : "translateX(-100%)",
          transition:"transform 0.3s ease",
        }}
      >
        <div style={{display:"flex",justifyContent:"flex-end",padding:"12px"}}>
          <button onClick={() => setMenuOpen(false)} style={{background:"none",border:"none",cursor:"pointer",padding:"4px"}} aria-label="Cerrar menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <NavContent />
      </div>

      <main style={{flex:1,backgroundColor:"#F4F4F4",overflowY:"auto",minWidth:0}}>
        {children}
      </main>

      <style>{`
        @media (max-width: 768px) {
          .admin-root { flex-direction: column; }
          .admin-sidebar-desktop { display: none !important; }
          .admin-topbar-mobile { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
