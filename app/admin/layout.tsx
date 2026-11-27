"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import AdminIcon from "@/components/admin/AdminIcon";

type NavLink = { href: string; label: string; icon: string };
type NavGroup = { title: string; links: NavLink[] };

// Modulo de redes e IA: los links solo aparecen si esta prendido.
const socialOn = process.env.NEXT_PUBLIC_FEATURE_SOCIAL === "true";

const groups: NavGroup[] = [
  { title: "Ventas", links: [
    { href: "/admin/orders", label: "Pedidos", icon: "bolsa" },
    { href: "/admin/customers", label: "Clientes", icon: "gente" },
    { href: "/admin/campaigns", label: "Campañas", icon: "enviar" },
  ]},
  ...(socialOn ? [{ title: "Marketing", links: [
    { href: "/admin/social", label: "Community manager", icon: "calendario" },
    { href: "/admin/social/inbox", label: "Mensajes", icon: "chat" },
    { href: "/admin/social/comentarios", label: "Comentarios", icon: "regalo" },
    { href: "/admin/social/referencia", label: "Desde un ejemplo", icon: "brillo" },
    { href: "/admin/social/crear", label: "Crear a mano", icon: "lapiz" },
  ]}] : []),
  { title: "Catálogo", links: [
    { href: "/admin/products", label: "Productos", icon: "etiqueta" },
    { href: "/admin/brands", label: "Marcas", icon: "estrella" },
    { href: "/admin/categories", label: "Categorías", icon: "tablero" },
    { href: "/admin/stock", label: "Stock", icon: "caja" },
  ]},
  { title: "Punto de venta", links: [
    { href: "/admin/pos", label: "Escanear", icon: "qr" },
    { href: "/admin/labels", label: "Etiquetas", icon: "impresora" },
    { href: "/admin/pos/cash-history", label: "Cierres de caja", icon: "dinero" },
  ]},
];

const allLinks = groups.flatMap((g) => g.links);

// La seccion activa es el link mas largo que coincide con la ruta
// (asi /admin/social/inbox marca "Mensajes" y no "Community manager").
function activeHref(pathname: string) {
  let best = "";
  for (const l of allLinks) {
    if ((pathname === l.href || pathname.startsWith(l.href + "/")) && l.href.length > best.length) best = l.href;
  }
  return best;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const active = activeHref(pathname);
  const tabsRef = useRef<HTMLDivElement>(null);

  // En el celu, la pestaña activa queda a la vista en la barra deslizable.
  useEffect(() => {
    const el = tabsRef.current?.querySelector<HTMLElement>("a.on");
    el?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [active]);

  // El login va sin menu.
  if (pathname.startsWith("/admin/login")) return <>{children}</>;

  return (
    <div className="adm">
      {/* CELU: marca + pestañas deslizables con iconos */}
      <header className="adm-top">
        <div className="adm-top-row">
          <div>
            <span className="adm-kicker">Member OS</span>
            <b>Backoffice</b>
          </div>
          <Link href="/" className="adm-store"><AdminIcon name="tienda" size={16} />Tienda</Link>
        </div>
        <div className="adm-tabs" ref={tabsRef}>
          {allLinks.map((l) => (
            <a key={l.href} href={l.href} className={l.href === active ? "on" : ""}>
              <AdminIcon name={l.icon} size={16} />{l.label}
            </a>
          ))}
        </div>
      </header>

      {/* COMPU: barra lateral */}
      <aside className="adm-side">
        <div className="adm-brand">
          <span className="adm-kicker">Member OS</span>
          <b>Backoffice</b>
        </div>
        <nav>
          {groups.map((g) => (
            <div key={g.title} className="adm-group">
              <p className="adm-group-title">{g.title}</p>
              {g.links.map((l) => (
                <a key={l.href} href={l.href} className={l.href === active ? "on" : ""}>
                  <AdminIcon name={l.icon} />{l.label}
                </a>
              ))}
            </div>
          ))}
        </nav>
        <Link href="/" className="adm-side-store"><AdminIcon name="tienda" size={16} />Ver tienda</Link>
      </aside>

      <main className="adm-main">{children}</main>

      <style>{`
        .adm{display:flex;min-height:100vh;background:#F4F4F4}
        .adm-kicker{display:block;font-size:10.5px;letter-spacing:.15em;text-transform:uppercase;color:#737373;margin-bottom:2px}
        .adm-side{width:240px;flex:none;background:#0A0A0A;color:#fff;position:sticky;top:0;height:100vh;box-sizing:border-box;display:flex;flex-direction:column;padding:18px 12px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.2) transparent}
        .adm-brand{padding:6px 12px 18px}
        .adm-brand b{font-size:15px;font-weight:700;letter-spacing:-.01em}
        .adm-side nav{flex:1}
        .adm-group{margin-bottom:14px}
        .adm-group-title{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#525252;margin:0 0 6px;padding-left:12px}
        .adm-side nav a{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;color:rgba(255,255,255,.65);text-decoration:none;font-size:14px;font-weight:500;margin-bottom:2px;transition:background .15s,color .15s}
        .adm-side nav a svg{opacity:.85}
        .adm-side nav a:hover{background:rgba(255,255,255,.06);color:#fff}
        .adm-side nav a.on{background:rgba(255,255,255,.12);color:#fff}
        .adm-side nav a.on svg{opacity:1}
        .adm-side-store{display:flex;align-items:center;gap:8px;padding:12px;margin-top:8px;border-top:1px solid #262626;font-size:13px;color:#737373;text-decoration:none}
        .adm-side-store:hover{color:#fff}
        .adm-main{flex:1;min-width:0;overflow-x:hidden}
        .adm-top{display:none}

        /* Tarjetas redondeadas (las usan Pedidos, Productos y Clientes) */
        .adm-card{border-radius:16px;overflow:hidden}

        @media (max-width: 1023px){
          .adm{display:block}
          .adm-side{display:none}
          .adm-top{display:block;position:sticky;top:0;z-index:40;background:#0A0A0A;color:#fff;padding-top:env(safe-area-inset-top)}
          .adm-top-row{display:flex;align-items:center;justify-content:space-between;padding:12px 14px 4px}
          .adm-top-row b{font-size:14px;font-weight:700}
          .adm-store{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;color:rgba(255,255,255,.7);text-decoration:none;padding:7px 12px;border:1px solid #262626;border-radius:999px}
          .adm-tabs{display:flex;gap:6px;overflow-x:auto;padding:10px 12px 12px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
          .adm-tabs::-webkit-scrollbar{display:none}
          .adm-tabs a{flex:none;display:inline-flex;align-items:center;gap:6px;color:rgba(255,255,255,.7);text-decoration:none;font-size:14px;font-weight:500;padding:8px 13px;border-radius:999px}
          .adm-tabs a.on{background:#fff;color:#0A0A0A}

          /* Las pantallas usan padding de 48px en linea: en el celu lo achicamos */
          .adm-main > div[style]{padding:18px 14px !important}
          .adm-main h1{font-size:22px !important}
          /* Tablas que todavia no tienen version celu: se deslizan de costado */
          .adm-main table{display:block;overflow-x:auto;-webkit-overflow-scrolling:touch}

          /* Encabezado con botones (Clientes, Productos) */
          .adm-head{flex-direction:column;align-items:stretch !important;gap:12px !important;margin-bottom:18px !important}
          .adm-head-actions{flex-wrap:wrap}
          .adm-head-actions > *{flex:1 1 auto;justify-content:center;text-align:center;border-radius:12px}
          .adm-filters{overflow-x:auto;scrollbar-width:none}
          .adm-filters::-webkit-scrollbar{display:none}
          .adm-filters a{flex:none;border-radius:999px !important}

          /* Pedidos como tarjetas */
          .ord-row{flex-direction:column;align-items:stretch !important;gap:10px;padding:14px 16px !important}
          .ord-info{flex-wrap:wrap;gap:6px 8px !important}
          .ord-num{width:auto !important}
          .ord-who{flex:1 1 60% !important;min-width:0}
          .ord-who p{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
          .ord-total{width:auto !important;margin-left:auto}
          .ord-info > span{border-radius:999px}
          .ord-date{width:100%;order:-1;font-size:11px !important}
          .ord-btn{margin-left:0 !important;text-align:center;border-radius:12px}

          /* Tablas convertidas en tarjetas (Productos, Clientes) */
          .adm-cards{display:block !important;overflow:visible !important}
          .adm-cards thead{display:none}
          .adm-cards tbody{display:block}
          .adm-cards tr{display:flex;flex-wrap:wrap;align-items:center;gap:6px 14px;padding:14px 16px}
          .adm-cards td{padding:0 !important;display:block}
          .adm-cards td.c-main{flex:1 1 100%}
          .adm-cards td.c-main a{font-size:15px;font-weight:600}
          .adm-btn-main{text-align:center;border-radius:12px}
          .adm-cards td.c-hide{display:none}
          .adm-cards td.c-actions{flex:1 1 100%}
          .adm-cards td.c-actions > div{gap:8px}
          .adm-cards td.c-actions a,.adm-cards td.c-actions button{flex:1;text-align:center;border-radius:12px}
          .adm-cards td[data-l]::before{content:attr(data-l);display:block;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#A3A3A3;margin-bottom:2px}
        }
      `}</style>
    </div>
  );
}
