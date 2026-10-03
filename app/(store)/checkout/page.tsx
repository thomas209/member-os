"use client";
import { useState, useEffect } from "react";
import { useCartStore } from "@/store/cart";
import { calculateShippingCost, FREE_SHIPPING_THRESHOLD } from "@/lib/shipping";
import { calculateTransferDiscount, TRANSFER_DISCOUNT_PERCENT, TRANSFER_DISCOUNT_MIN_PRICE } from "@/lib/bankDetails";
import { PROVINCES } from "@/lib/argentina";
import Autocomplete from "@/components/store/Autocomplete";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POSTAL_CODE_REGEX = /^(\d{4}|[A-Za-z]\d{4}[A-Za-z]{3})$/;

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resumenAbierto, setResumenAbierto] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"MERCADOPAGO" | "TRANSFERENCIA">("MERCADOPAGO");
  const [couponCode, setCouponCode] = useState("");
  const [couponStatus, setCouponStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [couponMessage, setCouponMessage] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    street: "", number: "", floor: "", city: "", province: "", postalCode: "",
  });
  const [loggedInEmail, setLoggedInEmail] = useState<string | null>(null);
  const [localidades, setLocalidades] = useState<string[]>([]);

  // Cuando la provincia elegida matchea una provincia real (no cualquier
  // cosa que este tipeando), trae sus localidades para sugerir en el
  // campo de ciudad. Si la API externa falla, se guarda una lista vacia
  // y el campo de ciudad sigue funcionando como texto libre.
  useEffect(() => {
    const match = PROVINCES.find((p) => p.toLowerCase() === form.province.trim().toLowerCase());
    if (!match) {
      setLocalidades([]);
      return;
    }
    let cancelled = false;
    fetch("/api/georef/localidades?provincia=" + encodeURIComponent(match))
      .then((res) => res.json())
      .then((data) => { if (!cancelled) setLocalidades(data.localidades || []); })
      .catch(() => { if (!cancelled) setLocalidades([]); });
    return () => { cancelled = true; };
  }, [form.province]);

  // Si hay sesion de cliente, precarga el formulario con los datos y la
  // direccion guardada. El checkout sigue funcionando igual sin sesion.
  useEffect(() => {
    fetch("/api/auth/customer/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.customer) return;
        setLoggedInEmail(data.customer.email);
        const addr = (data.customer.defaultAddress || {}) as Record<string, string>;
        setForm((prev) => ({
          ...prev,
          firstName: data.customer.firstName || prev.firstName,
          lastName: data.customer.lastName || prev.lastName,
          email: data.customer.email || prev.email,
          phone: data.customer.phone || prev.phone,
          street: addr.street || prev.street,
          number: addr.number || prev.number,
          floor: addr.floor || prev.floor,
          city: addr.city || prev.city,
          province: addr.province || prev.province,
          postalCode: addr.postalCode || prev.postalCode,
        }));
      })
      .catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCouponChange = (value: string) => {
    setCouponCode(value);
    // si ya se habia aplicado uno, al tocar el campo hay que volver a
    // aplicarlo para que el total refleje el codigo nuevo
    if (couponStatus !== "idle") {
      setCouponStatus("idle");
      setCouponMessage("");
      setCouponDiscount(0);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponStatus("checking");
    setCouponMessage("");
    try {
      const res = await fetch("/api/checkout/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, subtotal: totalPrice() }),
      });
      const data = await res.json();
      if (!data.valid) {
        setCouponStatus("invalid");
        setCouponMessage(data.error || "Cupon invalido");
        setCouponDiscount(0);
        return;
      }
      setCouponStatus("valid");
      setCouponDiscount(data.discountAmount);
      setCouponMessage("Cupon aplicado");
    } catch {
      setCouponStatus("invalid");
      setCouponMessage("Error al validar el cupon");
      setCouponDiscount(0);
    }
  };

  const shippingCost = calculateShippingCost(totalPrice());
  const missingForFreeShipping = FREE_SHIPPING_THRESHOLD - totalPrice();
  const transferDiscount = calculateTransferDiscount(items.map((i) => ({ price: i.price, quantity: i.quantity })));
  const appliedDiscount = paymentMethod === "TRANSFERENCIA" ? transferDiscount : (couponStatus === "valid" ? couponDiscount : 0);
  const finalTotal = totalPrice() - appliedDiscount + shippingCost;

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.street || !form.city) {
      setError("Completa los campos obligatorios");
      return;
    }
    if (!EMAIL_REGEX.test(form.email)) {
      setError("Ingresa un email valido");
      return;
    }
    if (form.phone && form.phone.replace(/\D/g, "").length < 8) {
      setError("Ingresa un telefono valido (con codigo de area)");
      return;
    }
    if (!POSTAL_CODE_REGEX.test(form.postalCode.trim())) {
      setError("Ingresa un codigo postal valido (ej: 1043 o C1043AAZ)");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
          shippingAddress: form,
          paymentMethod,
          couponCode: paymentMethod === "MERCADOPAGO" && couponStatus === "valid" ? couponCode : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error al procesar"); setLoading(false); return; }
      clearCart();
      window.location.href = data.redirectUrl || data.checkoutUrl;
    } catch (e) {
      setError("Error de conexion");
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div style={{maxWidth:"600px",margin:"80px auto",textAlign:"center",padding:"48px"}}>
        <p style={{fontSize:"16px",color:"#737373",marginBottom:"24px"}}>Tu carrito está vacío</p>
        <a href="/catalog" className="cart-cta cart-cta-chico" style={{display:"inline-flex"}}>Ver el catálogo</a>
      </div>
    );
  }

  return (
    <div className="co-wrap flex flex-col-reverse md:grid md:grid-cols-[1fr_400px] gap-8 md:gap-20">
      <div>
        <h1 className="co-titulo">Datos de envío</h1>
        {loggedInEmail && (
          <p style={{fontSize:"13px",color:"#737373",marginBottom:"24px"}}>
            Ingresaste como <strong style={{color:"#0A0A0A"}}>{loggedInEmail}</strong> · usamos tus datos guardados
          </p>
        )}
        
        <div className="grid grid-cols-2 gap-3 co-fila">
          <div>
            <label className="co-label">Nombre *</label>
            <input name="firstName" autoComplete="given-name" value={form.firstName} onChange={handleChange} placeholder="Thomas" className="co-campo" />
          </div>
          <div>
            <label className="co-label">Apellido *</label>
            <input name="lastName" autoComplete="family-name" value={form.lastName} onChange={handleChange} placeholder="Caronia" className="co-campo" />
          </div>
        </div>
        <div style={{marginBottom:"16px"}}>
          <label className="co-label">Email *</label>
          <input name="email" autoComplete="email" inputMode="email" type="email" value={form.email} onChange={handleChange} placeholder="thomas@example.com" className="co-campo" />
        </div>
        <div style={{marginBottom:"16px"}}>
          <label className="co-label">Telefono</label>
          <input name="phone" type="tel" autoComplete="tel" inputMode="tel" value={form.phone} onChange={handleChange} placeholder="1122334455" className="co-campo" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr] gap-3 co-fila co-fila-calle">
          <div>
            <label className="co-label">Calle *</label>
            <input name="street" autoComplete="address-line1" value={form.street} onChange={handleChange} placeholder="Av. Corrientes" className="co-campo" />
          </div>
          <div>
            <label className="co-label">Numero *</label>
            <input name="number" inputMode="numeric" value={form.number} onChange={handleChange} placeholder="1234" className="co-campo" />
          </div>
          <div>
            <label className="co-label">Piso</label>
            <input name="floor" value={form.floor} onChange={handleChange} placeholder="3B" className="co-campo" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 co-fila-fin">
          <div>
            <label className="co-label">Provincia *</label>
            <Autocomplete
              name="province"
              value={form.province}
              onChange={(v) => setForm({ ...form, province: v })}
              suggestions={PROVINCES}
              placeholder="Buenos Aires"
            />
          </div>
          <div>
            <label className="co-label">Ciudad *</label>
            <Autocomplete
              name="city"
              value={form.city}
              onChange={(v) => setForm({ ...form, city: v })}
              suggestions={localidades}
              placeholder="Buenos Aires"
            />
          </div>
          <div>
            <label className="co-label">CP *</label>
            <input name="postalCode" autoComplete="postal-code" inputMode="numeric" value={form.postalCode} onChange={handleChange} placeholder="1043" className="co-campo" />
          </div>
        </div>
        <h2 className="co-titulo">Método de pago</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 co-fila-fin">
          <div
            onClick={() => setPaymentMethod("MERCADOPAGO")}
            className="hover-pill"
            style={{
              cursor:"pointer",padding:"18px",borderRadius:"18px",border: paymentMethod === "MERCADOPAGO" ? "2px solid #0A0A0A" : "1px solid #D1D1D1",
            }}
          >
            <p style={{fontSize:"15px",fontWeight:"600",marginBottom:"4px"}}>Mercado Pago</p>
            <p style={{fontSize:"13px",color:"#737373"}}>Tarjeta, dinero en cuenta y más</p>
          </div>
          <div
            onClick={() => setPaymentMethod("TRANSFERENCIA")}
            className="hover-pill"
            style={{
              cursor:"pointer",padding:"18px",borderRadius:"18px",border: paymentMethod === "TRANSFERENCIA" ? "2px solid #0A0A0A" : "1px solid #D1D1D1",
            }}
          >
            <p style={{fontSize:"15px",fontWeight:"600",marginBottom:"4px"}}>Transferencia bancaria</p>
            {transferDiscount > 0 ? (
              <p style={{fontSize:"13px",color:"#16A34A",fontWeight:"600"}}>
                {TRANSFER_DISCOUNT_PERCENT}% OFF en productos de más de ${TRANSFER_DISCOUNT_MIN_PRICE.toLocaleString("es-AR")} (−${Math.round(transferDiscount).toLocaleString("es-AR")})
              </p>
            ) : (
              <p style={{fontSize:"11px",color:"#737373"}}>
                El {TRANSFER_DISCOUNT_PERCENT}% OFF aplica a productos de más de ${TRANSFER_DISCOUNT_MIN_PRICE.toLocaleString("es-AR")}
              </p>
            )}
          </div>
        </div>
        {items.some((i) => i.isEncargo) && (
          <p style={{fontSize:"12px",color:"#737373",marginBottom:"16px"}}>
            Tu pedido incluye productos por encargo: esos se envían por separado y pueden demorar más que el resto.
          </p>
        )}
        {error && <p style={{fontSize:"13px",color:"#DC2626",marginBottom:"16px"}}>{error}</p>}
        <button onClick={handleSubmit} disabled={loading} className="hover-btn-dark" style={{width:"100%",height:"56px",borderRadius:"999px",backgroundColor:loading?"#E8E8E8":"#0A0A0A",color:loading?"#A3A3A3":"white",fontSize:"17px",fontWeight:"500",border:"none",cursor:loading?"not-allowed":"pointer"}}>
          {loading ? "Procesando..." : paymentMethod === "TRANSFERENCIA" ? "Continuar con transferencia" : "Pagar con Mercado Pago"}
        </button>
      </div>
      <div className="co-resumen">
        <button type="button" className="co-resumen-toggle" aria-expanded={resumenAbierto} onClick={() => setResumenAbierto(!resumenAbierto)}>
          <span className="co-titulo co-titulo-resumen">Tu pedido <span className="co-n">{items.reduce((a, i) => a + i.quantity, 0)}</span></span>
          <span className="co-resumen-ver">
            {resumenAbierto ? "Ocultar" : "Ver detalle"}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{transform: resumenAbierto ? "rotate(180deg)" : "none", transition: "transform 0.3s ease"}} aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
          </span>
        </button>
        <div className={"co-items" + (resumenAbierto ? " abierto" : "")}>
          {items.map((item) => (
            <div key={item.variantId} style={{display:"flex",gap:"12px",alignItems:"center"}}>
              <div style={{width:"64px",height:"80px",backgroundColor:"#FFFFFF",borderRadius:"12px",flexShrink:0,overflow:"hidden"}}>
                {item.image ? (
                  <img src={item.image} alt={item.name} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                ) : (
                  <div style={{width:"100%",height:"100%",backgroundColor:"#E8E8E8"}} />
                )}
              </div>
              <div style={{flex:1}}>
                <p style={{fontSize:"14px",fontWeight:"500"}}>{item.name}</p>
                <p style={{fontSize:"13px",color:"#737373"}}>Talle {item.size} · {item.quantity} {item.quantity === 1 ? "unidad" : "unidades"}</p>
                {item.isEncargo && (
                  <p style={{fontSize:"11px",color:"#737373",marginTop:"2px"}}>Por encargo</p>
                )}
              </div>
              <p className="precio" style={{fontSize:"14px"}}>${(item.price * item.quantity).toLocaleString("es-AR")}</p>
            </div>
          ))}
        </div>
        <div style={{marginBottom:"16px",paddingBottom:"16px",borderBottom:"1px solid rgba(10,10,10,0.08)"}}>
          <label className="co-label">Cupon</label>
          {paymentMethod === "TRANSFERENCIA" ? (
            <p style={{fontSize:"12px",color:"#A3A3A3"}}>No se puede combinar con el descuento por transferencia</p>
          ) : (
            <>
              <div style={{display:"flex",gap:"8px"}}>
                <input
                  value={couponCode}
                  onChange={(e) => handleCouponChange(e.target.value)}
                  placeholder="WELCOME10"
                  disabled={couponStatus === "valid"}
                  className="co-campo co-campo-blanco" style={{flex:1,minWidth:0,textTransform:"uppercase",opacity:couponStatus==="valid"?0.6:1}}
                />
                {couponStatus === "valid" ? (
                  <button
                    onClick={() => { setCouponStatus("idle"); setCouponCode(""); setCouponDiscount(0); setCouponMessage(""); }}
                    className="hover-pill"
                    style={{padding:"0 20px",fontSize:"14px",fontWeight:"500",borderRadius:"999px",border:"1px solid transparent",backgroundColor:"white",color:"#0A0A0A",cursor:"pointer"}}
                  >
                    Quitar
                  </button>
                ) : (
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponStatus === "checking" || !couponCode.trim()}
                    className="hover-btn-dark"
                    style={{padding:"0 20px",fontSize:"14px",fontWeight:"500",borderRadius:"999px",border:"1px solid transparent",backgroundColor: !couponCode.trim() ? "#F4F4F4" : "#0A0A0A",color: !couponCode.trim() ? "#A3A3A3" : "white",cursor: !couponCode.trim() ? "not-allowed":"pointer"}}
                  >
                    {couponStatus === "checking" ? "..." : "Aplicar"}
                  </button>
                )}
              </div>
              {couponMessage && (
                <p style={{fontSize:"12px",marginTop:"8px",color: couponStatus === "valid" ? "#16A34A" : "#DC2626"}}>
                  {couponStatus === "valid" ? "Cupon aplicado: -$" + couponDiscount.toLocaleString("es-AR") : couponMessage}
                </p>
              )}
            </>
          )}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
          <p style={{fontSize:"14px",color:"#737373"}}>Subtotal</p>
          <p style={{fontSize:"14px",color:"#737373"}}>${totalPrice().toLocaleString("es-AR")}</p>
        </div>
        {appliedDiscount > 0 && (
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
            <p style={{fontSize:"14px",color:"#737373"}}>
              Descuento{paymentMethod === "TRANSFERENCIA" ? " (transferencia)" : ""}
            </p>
            <p style={{fontSize:"14px",color:"#737373"}}>-${appliedDiscount.toLocaleString("es-AR")}</p>
          </div>
        )}
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
          <p style={{fontSize:"14px",color:"#737373"}}>Envío</p>
          <p style={{fontSize:"14px",color:shippingCost===0?"#16A34A":"#737373",fontWeight:shippingCost===0?"600":"400"}}>
            {shippingCost === 0 ? "Gratis" : "$" + shippingCost.toLocaleString("es-AR")}
          </p>
        </div>
        {shippingCost > 0 && missingForFreeShipping > 0 && (
          <p style={{fontSize:"11px",color:"#A3A3A3",marginBottom:"4px"}}>
            Te faltan ${missingForFreeShipping.toLocaleString("es-AR")} para envío gratis
          </p>
        )}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:"8px"}}>
          <p style={{fontSize:"15px",color:"#0A0A0A",fontWeight:"500"}}>Total</p>
          <p className="precio" style={{fontSize:"22px"}}>${finalTotal.toLocaleString("es-AR")}</p>
        </div>
      </div>
    </div>
  );
}
