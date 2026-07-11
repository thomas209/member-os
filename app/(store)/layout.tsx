"use client";
import { useState } from "react";
import CartDrawer from "@/components/store/CartDrawer";
import CartButton from "@/components/store/CartButton";
import PromoMarquee from "@/components/store/PromoMarquee";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{minHeight: "100vh", display: "flex", flexDirection: "column"}}>
      <PromoMarquee />
      <header style={{position: "sticky", top: 0, zIndex: 50, backgroundColor: "white", borderBottom: "1px solid #E8E8E8"}}>

        {/* DESKTOP */}
        <div className="hidden md:flex" style={{maxWidth: "1440px", margin: "0 auto", padding: "0 48px", height: "56px", alignItems: "center", justifyContent: "space-between"}}>
          <a href="/" style={{fontWeight: "400", fontSize: "18px", letterSpacing: "0.02em", fontFamily: "Georgia, serif", textDecoration: "none", color: "#0A0A0A"}}>Member Club</a>
          <nav style={{display: "flex", gap: "32px"}}>
            <a href="/catalog" style={{fontSize: "13px", color: "#737373", textDecoration: "none", letterSpacing: "0.04em"}}>Catálogo</a>
            <a href="/catalog?gender=HOMBRE" style={{fontSize: "13px", color: "#737373", textDecoration: "none", letterSpacing: "0.04em"}}>Hombre</a>
            <a href="/catalog?gender=MUJER" style={{fontSize: "13px", color: "#737373", textDecoration: "none", letterSpacing: "0.04em"}}>Mujer</a>
            <a href="/catalog?category=arte" style={{fontSize: "12px", color: "white", backgroundColor: "#DC2626", textDecoration: "none", letterSpacing: "0.04em", padding: "4px 14px", borderRadius: "999px", fontWeight: "600"}}>Arte</a>
          </nav>
          <div style={{display: "flex", alignItems: "center", gap: "24px"}}>
            <a href="/cuenta" style={{fontSize: "13px", color: "#737373", textDecoration: "none", letterSpacing: "0.04em"}}>Mi cuenta</a>
            <CartButton />
          </div>
        </div>

        {/* MOBILE NAVBAR */}
        <div className="flex md:hidden items-center justify-between px-4 relative" style={{height: "56px"}}>
          <div style={{width: "40px"}} />
          <a href="/" className="absolute left-1/2 -translate-x-1/2" style={{fontWeight: "400", fontSize: "17px", letterSpacing: "0.02em", fontFamily: "Georgia, serif", textDecoration: "none", color: "#0A0A0A"}}>Member Club</a>
          <div style={{display: "flex", alignItems: "center", gap: "16px"}}>
            <CartButton />
            <button onClick={() => setMenuOpen(true)} style={{background: "none", border: "none", cursor: "pointer", padding: "4px"}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

      </header>

      {/* OVERLAY */}
      {menuOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 md:hidden" onClick={() => setMenuOpen(false)} />
      )}

      {/* DRAWER */}
      <div className={`fixed top-0 right-0 h-full w-full bg-white z-[60] md:hidden flex flex-col transition-transform duration-300 ${menuOpen ? "translate-x-0" : "translate-x-full"}`}>

        {/* Header drawer */}
        <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: "56px", borderBottom: "1px solid #F4F4F4"}}>
          <a href="/" onClick={() => setMenuOpen(false)} style={{fontWeight: "400", fontSize: "17px", letterSpacing: "0.02em", fontFamily: "Georgia, serif", textDecoration: "none", color: "#0A0A0A"}}>Member Club</a>
          <button onClick={() => setMenuOpen(false)} style={{background: "none", border: "none", cursor: "pointer", padding: "4px"}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Links principales */}
        <div style={{display: "flex", flexDirection: "column"}}>
          <a href="/catalog" onClick={() => setMenuOpen(false)} style={{padding: "20px", fontSize: "20px", fontWeight: "400", fontFamily: "Georgia, serif", color: "#0A0A0A", textDecoration: "none", borderBottom: "1px solid #F4F4F4"}}>Catálogo</a>
          <a href="/catalog?gender=HOMBRE" onClick={() => setMenuOpen(false)} style={{padding: "20px", fontSize: "20px", fontWeight: "400", fontFamily: "Georgia, serif", color: "#0A0A0A", textDecoration: "none", borderBottom: "1px solid #F4F4F4"}}>Hombre</a>
          <a href="/catalog?gender=MUJER" onClick={() => setMenuOpen(false)} style={{padding: "20px", fontSize: "20px", fontWeight: "400", fontFamily: "Georgia, serif", color: "#0A0A0A", textDecoration: "none", borderBottom: "1px solid #F4F4F4"}}>Mujer</a>
          <a href="/catalog?category=arte" onClick={() => setMenuOpen(false)} style={{padding: "20px", fontSize: "20px", fontWeight: "400", fontFamily: "Georgia, serif", color: "#DC2626", textDecoration: "none", borderBottom: "1px solid #F4F4F4"}}>Arte</a>
          <a href="/cuenta" onClick={() => setMenuOpen(false)} style={{padding: "20px", fontSize: "20px", fontWeight: "400", fontFamily: "Georgia, serif", color: "#0A0A0A", textDecoration: "none", borderBottom: "1px solid #F4F4F4"}}>Mi cuenta</a>
        </div>

        {/* Links secundarios */}
        <div style={{borderTop: "1px solid #E8E8E8", marginTop: "8px"}}>
          <a href="/stores" onClick={() => setMenuOpen(false)} style={{display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px", fontSize: "14px", fontWeight: "400", color: "#737373", textDecoration: "none", borderBottom: "1px solid #F4F4F4", letterSpacing: "0.06em", textTransform: "uppercase"}}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#737373" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.977 14C19.6 12.701 20 11.343 20 10a8 8 0 0 0-16 0c0 4.993 5.539 10.193 7.399 11.799a1 1 0 0 0 1.202 0 32 32 0 0 0 .824-.738"/><circle cx="12" cy="10" r="3"/><path d="M16 18h6"/></svg>
            Stores
          </a>
          <a href="/encargos" onClick={() => setMenuOpen(false)} style={{display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px", fontSize: "14px", fontWeight: "400", color: "#737373", textDecoration: "none", borderBottom: "1px solid #F4F4F4", letterSpacing: "0.06em", textTransform: "uppercase"}}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#737373" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>
            Encargos
          </a>
          <a href="/bigboy" onClick={() => setMenuOpen(false)} style={{display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px", fontSize: "14px", fontWeight: "700", color: "#DC2626", textDecoration: "none", letterSpacing: "0.06em"}}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r=".5" fill="#DC2626"/><circle cx="17.5" cy="10.5" r=".5" fill="#DC2626"/><circle cx="6.5" cy="12.5" r=".5" fill="#DC2626"/><circle cx="8.5" cy="7.5" r=".5" fill="#DC2626"/></svg>
            BIG.BOY.OK
          </a>
        </div>

      </div>

      <main style={{flex: 1}}>{children}</main>

      <footer style={{backgroundColor: "#FAFAFA", borderTop: "1px solid #E8E8E8", padding: "48px"}}>
        <div style={{maxWidth: "1440px", margin: "0 auto"}}>
          <p style={{fontSize: "13px", color: "#737373"}}>© 2026 Member Club. Todos los derechos reservados.</p>
        </div>
      </footer>

      <CartDrawer />
    </div>
  );
}
