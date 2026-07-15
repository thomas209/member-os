"use client";
import { useState, useEffect } from "react";
import { useCartStore } from "@/store/cart";
import { calculateShippingCost, FREE_SHIPPING_THRESHOLD } from "@/lib/shipping";
import { calculateTransferDiscount, TRANSFER_DISCOUNT_PERCENT } from "@/lib/bankDetails";
import { PROVINCES } from "@/lib/argentina";
import Autocomplete from "@/components/store/Autocomplete";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POSTAL_CODE_REGEX = /^(\d{4}|[A-Za-z]\d{4}[A-Za-z]{3})$/;

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
  const transferDiscount = calculateTransferDiscount(totalPrice());
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
        <p style={{fontSize:"16px",color:"#737373",marginBottom:"24px"}}>Tu carrito esta vacio</p>
        <a href="/catalog" style={{fontSize:"13px",fontWeight:"600",letterSpacing:"0.1em",textTransform:"uppercase",textDecoration:"none",color:"#0A0A0A",border:"1px solid #0A0A0A",padding:"14px 32px"}}>Ver catalogo</a>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8 md:px-12 md:py-12 flex flex-col-reverse md:grid md:grid-cols-[1fr_400px] gap-8 md:gap-20">
      <div>
        <h1 style={{fontSize:"13px",fontWeight:"600",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:"8px",paddingBottom:"16px",borderBottom:"1px solid #E8E8E8"}}>Datos de envio</h1>
        {loggedInEmail && (
          <p style={{fontSize:"12px",color:"#737373",marginBottom:"40px"}}>
            Ingresaste como <strong style={{color:"#0A0A0A"}}>{loggedInEmail}</strong> · usamos tus datos guardados
          </p>
        )}
        {!loggedInEmail && <div style={{marginBottom:"40px"}} />}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label style={{display:"block",fontSize:"11px",fontWeight:"600",letterSpacing:"0.08em",textTransform:"uppercase",color:"#737373",marginBottom:"8px"}}>Nombre *</label>
            <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="Thomas" style={{width:"100%",padding:"12px",border:"1px solid #D1D1D1",fontSize:"14px",outline:"none"}} />
          </div>
          <div>
            <label style={{display:"block",fontSize:"11px",fontWeight:"600",letterSpacing:"0.08em",textTransform:"uppercase",color:"#737373",marginBottom:"8px"}}>Apellido *</label>
            <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Caronia" style={{width:"100%",padding:"12px",border:"1px solid #D1D1D1",fontSize:"14px",outline:"none"}} />
          </div>
        </div>
        <div style={{marginBottom:"16px"}}>
          <label style={{display:"block",fontSize:"11px",fontWeight:"600",letterSpacing:"0.08em",textTransform:"uppercase",color:"#737373",marginBottom:"8px"}}>Email *</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="thomas@example.com" style={{width:"100%",padding:"12px",border:"1px solid #D1D1D1",fontSize:"14px",outline:"none"}} />
        </div>
        <div style={{marginBottom:"16px"}}>
          <label style={{display:"block",fontSize:"11px",fontWeight:"600",letterSpacing:"0.08em",textTransform:"uppercase",color:"#737373",marginBottom:"8px"}}>Telefono</label>
          <input name="phone" value={form.phone} onChange={handleChange} placeholder="1122334455" style={{width:"100%",padding:"12px",border:"1px solid #D1D1D1",fontSize:"14px",outline:"none"}} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-4 mb-4">
          <div>
            <label style={{display:"block",fontSize:"11px",fontWeight:"600",letterSpacing:"0.08em",textTransform:"uppercase",color:"#737373",marginBottom:"8px"}}>Calle *</label>
            <input name="street" value={form.street} onChange={handleChange} placeholder="Av. Corrientes" style={{width:"100%",padding:"12px",border:"1px solid #D1D1D1",fontSize:"14px",outline:"none"}} />
          </div>
          <div>
            <label style={{display:"block",fontSize:"11px",fontWeight:"600",letterSpacing:"0.08em",textTransform:"uppercase",color:"#737373",marginBottom:"8px"}}>Numero *</label>
            <input name="number" value={form.number} onChange={handleChange} placeholder="1234" style={{width:"100%",padding:"12px",border:"1px solid #D1D1D1",fontSize:"14px",outline:"none"}} />
          </div>
          <div>
            <label style={{display:"block",fontSize:"11px",fontWeight:"600",letterSpacing:"0.08em",textTransform:"uppercase",color:"#737373",marginBottom:"8px"}}>Piso</label>
            <input name="floor" value={form.floor} onChange={handleChange} placeholder="3B" style={{width:"100%",padding:"12px",border:"1px solid #D1D1D1",fontSize:"14px",outline:"none"}} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div>
            <label style={{display:"block",fontSize:"11px",fontWeight:"600",letterSpacing:"0.08em",textTransform:"uppercase",color:"#737373",marginBottom:"8px"}}>Ciudad *</label>
            <Autocomplete
              name="city"
              value={form.city}
              onChange={(v) => setForm({ ...form, city: v })}
              suggestions={localidades}
              placeholder="Buenos Aires"
            />
          </div>
          <div>
            <label style={{display:"block",fontSize:"11px",fontWeight:"600",letterSpacing:"0.08em",textTransform:"uppercase",color:"#737373",marginBottom:"8px"}}>Provincia *</label>
            <Autocomplete
              name="province"
              value={form.province}
              onChange={(v) => setForm({ ...form, province: v })}
              suggestions={PROVINCES}
              placeholder="Buenos Aires"
            />
          </div>
          <div>
            <label style={{display:"block",fontSize:"11px",fontWeight:"600",letterSpacing:"0.08em",textTransform:"uppercase",color:"#737373",marginBottom:"8px"}}>CP *</label>
            <input name="postalCode" value={form.postalCode} onChange={handleChange} placeholder="1043" style={{width:"100%",padding:"12px",border:"1px solid #D1D1D1",fontSize:"14px",outline:"none"}} />
          </div>
        </div>
        <h2 style={{fontSize:"13px",fontWeight:"600",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:"16px",paddingBottom:"16px",borderBottom:"1px solid #E8E8E8"}}>Método de pago</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
          <div
            onClick={() => setPaymentMethod("MERCADOPAGO")}
            style={{
              cursor:"pointer",padding:"16px",border: paymentMethod === "MERCADOPAGO" ? "2px solid #0A0A0A" : "1px solid #D1D1D1",
            }}
          >
            <p style={{fontSize:"13px",fontWeight:"600",marginBottom:"4px"}}>Mercado Pago</p>
            <p style={{fontSize:"11px",color:"#737373"}}>Tarjeta, dinero en cuenta y más</p>
          </div>
          <div
            onClick={() => setPaymentMethod("TRANSFERENCIA")}
            style={{
              cursor:"pointer",padding:"16px",border: paymentMethod === "TRANSFERENCIA" ? "2px solid #0A0A0A" : "1px solid #D1D1D1",
            }}
          >
            <p style={{fontSize:"13px",fontWeight:"600",marginBottom:"4px"}}>Transferencia bancaria</p>
            <p style={{fontSize:"11px",color:"#16A34A",fontWeight:"600"}}>{TRANSFER_DISCOUNT_PERCENT}% de descuento</p>
          </div>
        </div>
        {items.some((i) => i.isEncargo) && (
          <p style={{fontSize:"12px",color:"#737373",marginBottom:"16px"}}>
            Tu pedido incluye productos por encargo: esos se envían por separado y pueden demorar más que el resto.
          </p>
        )}
        {error && <p style={{fontSize:"13px",color:"#DC2626",marginBottom:"16px"}}>{error}</p>}
        <button onClick={handleSubmit} disabled={loading} style={{width:"100%",padding:"18px",backgroundColor:loading?"#E8E8E8":"#0A0A0A",color:loading?"#A3A3A3":"white",fontSize:"13px",fontWeight:"600",letterSpacing:"0.1em",textTransform:"uppercase",border:"none",cursor:loading?"not-allowed":"pointer"}}>
          {loading ? "Procesando..." : paymentMethod === "TRANSFERENCIA" ? "Continuar con transferencia" : "Pagar con Mercado Pago"}
        </button>
      </div>
      <div>
        <h2 style={{fontSize:"13px",fontWeight:"600",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:"24px",paddingBottom:"16px",borderBottom:"1px solid #E8E8E8"}}>Resumen</h2>
        <div style={{display:"flex",flexDirection:"column",gap:"16px",marginBottom:"24px"}}>
          {items.map((item) => (
            <div key={item.variantId} style={{display:"flex",gap:"12px",alignItems:"center",marginBottom:"16px"}}>
              <div style={{width:"64px",height:"80px",backgroundColor:"#F4F4F4",flexShrink:0,overflow:"hidden"}}>
                {item.image ? (
                  <img src={item.image} alt={item.name} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                ) : (
                  <div style={{width:"100%",height:"100%",backgroundColor:"#E8E8E8"}} />
                )}
              </div>
              <div style={{flex:1}}>
                <p style={{fontSize:"13px",fontWeight:"500"}}>{item.name}</p>
                <p style={{fontSize:"11px",color:"#737373"}}>Talle {item.size} x {item.quantity}</p>
                {item.isEncargo && (
                  <p style={{fontSize:"11px",color:"#737373",marginTop:"2px"}}>Por encargo</p>
                )}
              </div>
              <p style={{fontSize:"13px",fontWeight:"700"}}>${(item.price * item.quantity).toLocaleString("es-AR")}</p>
            </div>
          ))}
        </div>
        <div style={{marginBottom:"16px",paddingBottom:"16px",borderBottom:"1px solid #E8E8E8"}}>
          <label style={{display:"block",fontSize:"11px",fontWeight:"600",letterSpacing:"0.08em",textTransform:"uppercase",color:"#737373",marginBottom:"8px"}}>Cupon</label>
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
                  style={{flex:1,padding:"12px",border:"1px solid #D1D1D1",fontSize:"14px",outline:"none",textTransform:"uppercase",backgroundColor:couponStatus==="valid"?"#F4F4F4":"white"}}
                />
                {couponStatus === "valid" ? (
                  <button
                    onClick={() => { setCouponStatus("idle"); setCouponCode(""); setCouponDiscount(0); setCouponMessage(""); }}
                    style={{padding:"12px 16px",fontSize:"12px",fontWeight:"600",letterSpacing:"0.06em",textTransform:"uppercase",border:"1px solid #0A0A0A",backgroundColor:"white",color:"#0A0A0A",cursor:"pointer"}}
                  >
                    Quitar
                  </button>
                ) : (
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponStatus === "checking" || !couponCode.trim()}
                    style={{padding:"12px 16px",fontSize:"12px",fontWeight:"600",letterSpacing:"0.06em",textTransform:"uppercase",border:"1px solid #0A0A0A",backgroundColor: !couponCode.trim() ? "#F4F4F4" : "#0A0A0A",color: !couponCode.trim() ? "#A3A3A3" : "white",cursor: !couponCode.trim() ? "not-allowed":"pointer"}}
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
          <p style={{fontSize:"14px",color:"#737373"}}>Total</p>
          <p style={{fontSize:"20px",fontWeight:"700"}}>${finalTotal.toLocaleString("es-AR")}</p>
        </div>
      </div>
    </div>
  );
}
