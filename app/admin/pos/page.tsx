"use client";
import { useState, useRef, useEffect } from "react";

type VariantSummary = { id: string; size: string; stock: number };

type ScannedItem = {
  variantId: string;
  productId: string;
  name: string;
  brand: string;
  size: string;
  colorName: string | null;
  colorHex: string | null;
  price: number;
  stock: number;
  image: string | null;
  allVariants: VariantSummary[];
  qty: number;
};

type CashSession = {
  id: string;
  openingAmount: number;
  openedAt: string;
  openedByName: string;
};

type PaymentMethod = "EFECTIVO" | "TARJETA" | "TRANSFERENCIA";

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  EFECTIVO: "Efectivo",
  TARJETA: "Tarjeta",
  TRANSFERENCIA: "Transferencia",
};

export default function PosPage() {
  // --- Caja ---
  // undefined = todavia no sabemos si hay caja abierta, null = no hay caja abierta
  const [cashSession, setCashSession] = useState<CashSession | null | undefined>(undefined);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [openingAmountInput, setOpeningAmountInput] = useState("");
  const [openingCash, setOpeningCash] = useState(false);
  const [openCashError, setOpenCashError] = useState("");

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeSummary, setCloseSummary] = useState<{ totals: Record<string, number>; expectedCash: number; orderCount: number } | null>(null);
  const [closingCountInput, setClosingCountInput] = useState("");
  const [closingCash, setClosingCash] = useState(false);
  const [closeResult, setCloseResult] = useState<{ expectedCash: number; counted: number; difference: number } | null>(null);
  const [closeError, setCloseError] = useState("");

  // --- Escaneo / carrito ---
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<ScannedItem | null>(null);
  const [cart, setCart] = useState<ScannedItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef<any>(null);
  const lastCodeRef = useRef<string>("");
  const lastScanTimeRef = useRef<number>(0);

  // --- Cobro ---
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [lastSale, setLastSale] = useState<{ orderNumber: number; total: number } | null>(null);

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const fetchCashSession = async () => {
    try {
      const res = await fetch("/api/admin/pos/cash-register/current");
      const data = await res.json();
      setCashSession(data.session ?? null);
      return data;
    } catch {
      setCashSession(null);
      return null;
    }
  };

  useEffect(() => {
    fetchCashSession();
  }, []);

  const openCashRegister = async () => {
    const amount = Number(openingAmountInput);
    if (isNaN(amount) || amount < 0) {
      setOpenCashError("Ingresa un monto valido");
      return;
    }
    setOpeningCash(true);
    setOpenCashError("");
    try {
      const res = await fetch("/api/admin/pos/cash-register/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openingAmount: amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOpenCashError(data.error || "No se pudo abrir la caja");
        setOpeningCash(false);
        return;
      }
      await fetchCashSession();
      setOpeningAmountInput("");
      setShowOpenModal(false);
    } catch {
      setOpenCashError("Error de conexion");
    }
    setOpeningCash(false);
  };

  const openCloseModal = async () => {
    setShowCloseModal(true);
    setCloseResult(null);
    setCloseError("");
    const data = await fetchCashSession();
    if (data?.session) {
      setCloseSummary({ totals: data.totals, expectedCash: data.expectedCash, orderCount: data.orderCount });
    }
  };

  const closeCashRegister = async () => {
    if (!cashSession) return;
    const counted = Number(closingCountInput);
    if (isNaN(counted) || counted < 0) {
      setCloseError("Ingresa el monto contado en caja");
      return;
    }
    setClosingCash(true);
    setCloseError("");
    try {
      const res = await fetch("/api/admin/pos/cash-register/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: cashSession.id, closingAmountCounted: counted }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCloseError(data.error || "No se pudo cerrar la caja");
        setClosingCash(false);
        return;
      }
      setCloseResult({ expectedCash: data.expectedCash, counted: data.counted, difference: data.difference });
    } catch {
      setCloseError("Error de conexion");
    }
    setClosingCash(false);
  };

  const finishClosing = () => {
    setShowCloseModal(false);
    setCloseSummary(null);
    setCloseResult(null);
    setClosingCountInput("");
    setCart([]);
    setLastScanned(null);
    setLastSale(null);
    setCashSession(null);
  };

  const lookupVariant = async (variantId: string) => {
    // Evitar procesar el mismo codigo repetido en menos de 2 segundos (la camara lee varias veces por segundo)
    const now = Date.now();
    if (variantId === lastCodeRef.current && now - lastScanTimeRef.current < 2000) return;
    lastCodeRef.current = variantId;
    lastScanTimeRef.current = now;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/pos/variant/" + variantId);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Producto no encontrado");
        setLoading(false);
        return;
      }
      const item: ScannedItem = { ...data, qty: 1 };
      setLastScanned(item);
      setCart((prev) => {
        const existing = prev.find((p) => p.variantId === item.variantId);
        if (existing) {
          return prev.map((p) => (p.variantId === item.variantId ? { ...p, qty: p.qty + 1 } : p));
        }
        return [...prev, item];
      });
    } catch {
      setError("Error de conexion");
    }
    setLoading(false);
  };

  // Corregir el talle sin volver a escanear: usa la data que ya tenemos de allVariants
  const switchToSize = (newVariant: VariantSummary) => {
    if (!lastScanned || newVariant.id === lastScanned.variantId) return;

    const previousVariantId = lastScanned.variantId;
    const newItem: ScannedItem = {
      ...lastScanned,
      variantId: newVariant.id,
      size: newVariant.size,
      stock: newVariant.stock,
    };

    setCart((prev) => {
      const previousInCart = prev.find((p) => p.variantId === previousVariantId);
      const qtyToMove = previousInCart ? previousInCart.qty : 1;
      const withoutOld = prev.filter((p) => p.variantId !== previousVariantId);
      const existingNew = withoutOld.find((p) => p.variantId === newVariant.id);
      if (existingNew) {
        return withoutOld.map((p) => (p.variantId === newVariant.id ? { ...p, qty: p.qty + qtyToMove } : p));
      }
      return [...withoutOld, { ...newItem, qty: qtyToMove }];
    });

    setLastScanned(newItem);
  };

  const startScanning = async () => {
    setError("");
    setScanning(true);
  };

  useEffect(() => {
    if (!scanning) return;

    let isMounted = true;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (!isMounted) return;
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            lookupVariant(decodedText);
          },
          () => {}
        )
        .catch(() => {
          setError("No se pudo acceder a la camara. Revisa los permisos.");
          setScanning(false);
        });
    });

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [scanning]);

  const stopScanning = () => {
    setScanning(false);
  };

  const removeFromCart = (variantId: string) => {
    setCart((prev) => prev.filter((p) => p.variantId !== variantId));
  };

  const updateQty = (variantId: string, qty: number) => {
    if (qty < 1) return;
    setCart((prev) => prev.map((p) => (p.variantId === variantId ? { ...p, qty } : p)));
  };

  const openPaymentModal = () => {
    if (cart.length === 0) return;
    // Se puede escanear y ver stock sin caja abierta, pero para cobrar hace falta una sesion
    if (!cashSession) {
      setOpenCashError("");
      setShowOpenModal(true);
      return;
    }
    setSelectedMethod(null);
    setCheckoutError("");
    setShowPaymentModal(true);
  };

  const confirmCheckout = async () => {
    if (!selectedMethod || cart.length === 0) return;
    setCheckingOut(true);
    setCheckoutError("");
    try {
      const res = await fetch("/api/admin/pos/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((c) => ({ variantId: c.variantId, qty: c.qty })),
          paymentMethod: selectedMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.detail) {
          setCheckoutError(
            "Stock insuficiente: " + data.detail.productName + " talle " + data.detail.size + " (quedan " + data.detail.available + ")"
          );
        } else {
          setCheckoutError(data.error || "No se pudo procesar el cobro");
        }
        setCheckingOut(false);
        return;
      }
      setLastSale({ orderNumber: data.orderNumber, total: data.total });
      setCart([]);
      setLastScanned(null);
      setShowPaymentModal(false);
    } catch {
      setCheckoutError("Error de conexion");
    }
    setCheckingOut(false);
  };

  // --- PANTALLA DE CARGA INICIAL ---
  if (cashSession === undefined) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", backgroundColor: "#F4F4F4" }}>
        <p style={{ fontSize: "13px", color: "#737373" }}>Cargando...</p>
      </div>
    );
  }

  // --- POS: el escaneo y la consulta de stock funcionan siempre, con o sin caja abierta.
  // Solo cobrar requiere una caja abierta. ---
  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#F4F4F4" }} className="pos-container">
      {/* PANEL ESCANEO */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px", overflowY: "auto" }} className="pos-scan-panel">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: "700" }}>Punto de venta</h1>
            {cashSession ? (
              <p style={{ fontSize: "12px", color: "#737373" }}>
                Caja abierta con ${cashSession.openingAmount.toLocaleString("es-AR")} · {cashSession.openedByName}
              </p>
            ) : (
              <p style={{ fontSize: "12px", color: "#D97706" }}>
                Caja cerrada · podés escanear para ver stock, pero para cobrar hay que abrirla
              </p>
            )}
          </div>
          {cashSession ? (
            <button
              onClick={openCloseModal}
              style={{ padding: "8px 14px", fontSize: "12px", fontWeight: "600", backgroundColor: "white", color: "#0A0A0A", border: "1px solid #E8E8E8", borderRadius: "8px", cursor: "pointer" }}
            >
              Cerrar caja
            </button>
          ) : (
            <button
              onClick={() => { setOpenCashError(""); setShowOpenModal(true); }}
              style={{ padding: "8px 14px", fontSize: "12px", fontWeight: "600", backgroundColor: "#0A0A0A", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}
            >
              Abrir caja
            </button>
          )}
        </div>

        {lastSale && (
          <div style={{ backgroundColor: "#DCFCE7", border: "1px solid #16A34A", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: "13px", color: "#16A34A", fontWeight: "600" }}>
              Venta #{lastSale.orderNumber} cobrada · ${lastSale.total.toLocaleString("es-AR")}
            </p>
            <button onClick={() => setLastSale(null)} style={{ background: "none", border: "none", color: "#16A34A", cursor: "pointer", fontSize: "16px" }}>×</button>
          </div>
        )}

        {!scanning ? (
          <button
            onClick={startScanning}
            style={{
              padding: "40px",
              fontSize: "20px",
              fontWeight: "700",
              backgroundColor: "#0A0A0A",
              color: "white",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              marginBottom: "20px",
            }}
          >
            📷 Escanear
          </button>
        ) : (
          <div style={{ marginBottom: "20px" }}>
            <div id="qr-reader" style={{ width: "100%", maxWidth: "400px", borderRadius: "12px", overflow: "hidden" }} />
            <button
              onClick={stopScanning}
              style={{
                marginTop: "12px",
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: "600",
                backgroundColor: "white",
                color: "#DC2626",
                border: "1px solid #DC2626",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Detener camara
            </button>
          </div>
        )}

        {error && (
          <p style={{ color: "#DC2626", fontSize: "14px", marginBottom: "16px", padding: "12px", backgroundColor: "#FEE2E2", borderRadius: "8px" }}>
            {error}
          </p>
        )}

        {loading && <p style={{ fontSize: "13px", color: "#737373" }}>Buscando producto...</p>}

        {/* Tarjeta del ultimo producto escaneado */}
        {lastScanned && !loading && (
          <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
              {lastScanned.image ? (
                <img src={lastScanned.image} alt={lastScanned.name} style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px" }} />
              ) : (
                <div style={{ width: "80px", height: "80px", backgroundColor: "#F4F4F4", borderRadius: "8px" }} />
              )}
              <div>
                <p style={{ fontSize: "11px", color: "#A3A3A3", textTransform: "uppercase", letterSpacing: "0.06em" }}>{lastScanned.brand}</p>
                <p style={{ fontSize: "16px", fontWeight: "700", marginBottom: "4px" }}>{lastScanned.name}</p>
                <p style={{ fontSize: "13px", color: "#737373" }}>
                  {lastScanned.colorName ? lastScanned.colorName : ""}
                </p>
                <p style={{ fontSize: "16px", fontWeight: "700", marginTop: "4px" }}>
                  ${lastScanned.price.toLocaleString("es-AR")}
                </p>
              </div>
            </div>

            {/* Desglose de todos los talles del modelo — clickeables para corregir el talle */}
            <p style={{ fontSize: "11px", color: "#A3A3A3", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
              Talles disponibles
            </p>
            <p style={{ fontSize: "11px", color: "#A3A3A3", marginBottom: "8px" }}>
              Tocá otro talle si el cliente se lleva uno distinto al escaneado
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {lastScanned.allVariants.map((v) => {
                const isSelected = v.id === lastScanned.variantId;
                return (
                  <button
                    key={v.id}
                    onClick={() => switchToSize(v)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: isSelected ? "2px solid #0A0A0A" : "1px solid #E8E8E8",
                      backgroundColor: isSelected ? "#0A0A0A" : "white",
                      color: isSelected ? "white" : "#0A0A0A",
                      textAlign: "center",
                      minWidth: "56px",
                      cursor: "pointer",
                    }}
                  >
                    <p style={{ fontSize: "13px", fontWeight: "700" }}>{v.size}</p>
                    <p style={{ fontSize: "10px", color: isSelected ? "rgba(255,255,255,0.7)" : (v.stock > 0 ? "#16A34A" : "#DC2626") }}>
                      Stock {v.stock}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* PANEL CARRITO */}
      <div style={{ width: "380px", backgroundColor: "white", borderLeft: "1px solid #E8E8E8", display: "flex", flexDirection: "column" }} className="pos-cart-panel">
        <div style={{ padding: "20px", borderBottom: "1px solid #E8E8E8" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "700" }}>Carrito ({cart.length})</h2>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
          {cart.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#A3A3A3", textAlign: "center", marginTop: "40px" }}>
              Escaneá un producto para empezar
            </p>
          ) : (
            cart.map((item) => (
              <div key={item.variantId} style={{ display: "flex", gap: "10px", padding: "10px", borderBottom: "1px solid #F4F4F4" }}>
                {item.image ? (
                  <img src={item.image} alt={item.name} style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "6px" }} />
                ) : (
                  <div style={{ width: "48px", height: "48px", backgroundColor: "#F4F4F4", borderRadius: "6px" }} />
                )}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "12px", fontWeight: "600" }}>{item.name}</p>
                  <p style={{ fontSize: "11px", color: "#737373" }}>
                    Talle {item.size}
                    {item.qty > item.stock && (
                      <span style={{ color: "#DC2626", fontWeight: "600" }}> · supera el stock ({item.stock})</span>
                    )}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                    <button onClick={() => updateQty(item.variantId, item.qty - 1)} style={{ width: "20px", height: "20px", border: "1px solid #E8E8E8", background: "white", cursor: "pointer" }}>-</button>
                    <span style={{ fontSize: "12px" }}>{item.qty}</span>
                    <button onClick={() => updateQty(item.variantId, item.qty + 1)} style={{ width: "20px", height: "20px", border: "1px solid #E8E8E8", background: "white", cursor: "pointer" }}>+</button>
                    <span style={{ fontSize: "12px", fontWeight: "700", marginLeft: "auto" }}>${(item.price * item.qty).toLocaleString("es-AR")}</span>
                  </div>
                </div>
                <button onClick={() => removeFromCart(item.variantId)} style={{ background: "none", border: "none", color: "#DC2626", cursor: "pointer", fontSize: "16px" }}>×</button>
              </div>
            ))
          )}
        </div>
        <div style={{ padding: "20px", borderTop: "1px solid #E8E8E8" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
            <span style={{ fontSize: "14px", fontWeight: "600" }}>Total</span>
            <span style={{ fontSize: "20px", fontWeight: "700" }}>${total.toLocaleString("es-AR")}</span>
          </div>
          <button
            onClick={openPaymentModal}
            disabled={cart.length === 0}
            style={{
              width: "100%",
              padding: "16px",
              fontSize: "14px",
              fontWeight: "700",
              backgroundColor: cart.length === 0 ? "#E8E8E8" : "#0A0A0A",
              color: cart.length === 0 ? "#A3A3A3" : "white",
              border: "none",
              borderRadius: "8px",
              cursor: cart.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            Cobrar
          </button>
        </div>
      </div>

      {/* MODAL DE COBRO */}
      {showPaymentModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px" }}>
          <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px", width: "100%", maxWidth: "380px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "4px" }}>Cobrar ${total.toLocaleString("es-AR")}</h2>
            <p style={{ fontSize: "13px", color: "#737373", marginBottom: "16px" }}>Elegi el metodo de pago</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
              {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((method) => (
                <button
                  key={method}
                  onClick={() => setSelectedMethod(method)}
                  style={{
                    padding: "14px",
                    fontSize: "14px",
                    fontWeight: "600",
                    borderRadius: "8px",
                    border: selectedMethod === method ? "2px solid #0A0A0A" : "1px solid #E8E8E8",
                    backgroundColor: selectedMethod === method ? "#0A0A0A" : "white",
                    color: selectedMethod === method ? "white" : "#0A0A0A",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  {PAYMENT_LABELS[method]}
                </button>
              ))}
            </div>

            {checkoutError && (
              <p style={{ color: "#DC2626", fontSize: "13px", marginBottom: "16px", padding: "10px", backgroundColor: "#FEE2E2", borderRadius: "8px" }}>
                {checkoutError}
              </p>
            )}

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={checkingOut}
                style={{ flex: 1, padding: "12px", fontSize: "13px", fontWeight: "600", backgroundColor: "white", color: "#737373", border: "1px solid #E8E8E8", borderRadius: "8px", cursor: "pointer" }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmCheckout}
                disabled={!selectedMethod || checkingOut}
                style={{
                  flex: 2,
                  padding: "12px",
                  fontSize: "13px",
                  fontWeight: "700",
                  backgroundColor: !selectedMethod || checkingOut ? "#E8E8E8" : "#0A0A0A",
                  color: !selectedMethod || checkingOut ? "#A3A3A3" : "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: !selectedMethod || checkingOut ? "not-allowed" : "pointer",
                }}
              >
                {checkingOut ? "Procesando..." : "Confirmar cobro"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE APERTURA DE CAJA */}
      {showOpenModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px" }}>
          <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px", width: "100%", maxWidth: "360px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "6px" }}>Abrir caja</h2>
            <p style={{ fontSize: "13px", color: "#737373", marginBottom: "20px" }}>
              Ingresa el monto de efectivo inicial para poder cobrar.
            </p>
            <label style={{ fontSize: "11px", color: "#A3A3A3", textTransform: "uppercase", letterSpacing: "0.06em" }}>Monto inicial</label>
            <input
              type="number"
              inputMode="decimal"
              value={openingAmountInput}
              onChange={(e) => setOpeningAmountInput(e.target.value)}
              placeholder="0"
              style={{ width: "100%", padding: "12px", fontSize: "18px", fontWeight: "700", border: "1px solid #E8E8E8", borderRadius: "8px", marginTop: "6px", marginBottom: "16px" }}
            />
            {openCashError && (
              <p style={{ color: "#DC2626", fontSize: "13px", marginBottom: "16px" }}>{openCashError}</p>
            )}
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setShowOpenModal(false)}
                disabled={openingCash}
                style={{ flex: 1, padding: "12px", fontSize: "13px", fontWeight: "600", backgroundColor: "white", color: "#737373", border: "1px solid #E8E8E8", borderRadius: "8px", cursor: "pointer" }}
              >
                Cancelar
              </button>
              <button
                onClick={openCashRegister}
                disabled={openingCash}
                style={{
                  flex: 2,
                  padding: "12px",
                  fontSize: "13px",
                  fontWeight: "700",
                  backgroundColor: "#0A0A0A",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: openingCash ? "default" : "pointer",
                  opacity: openingCash ? 0.6 : 1,
                }}
              >
                {openingCash ? "Abriendo..." : "Abrir caja"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CIERRE DE CAJA */}
      {showCloseModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px" }}>
          <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px", width: "100%", maxWidth: "380px" }}>
            {!closeResult ? (
              <>
                <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px" }}>Cerrar caja</h2>

                {closeSummary ? (
                  <div style={{ backgroundColor: "#F4F4F4", borderRadius: "8px", padding: "14px", marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#737373", marginBottom: "4px" }}>
                      <span>Ventas ({closeSummary.orderCount})</span>
                    </div>
                    {(["EFECTIVO", "TARJETA", "TRANSFERENCIA"] as const).map((m) => (
                      <div key={m} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "2px" }}>
                        <span>{PAYMENT_LABELS[m]}</span>
                        <span style={{ fontWeight: "600" }}>${(closeSummary.totals[m] || 0).toLocaleString("es-AR")}</span>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #E8E8E8", fontWeight: "700" }}>
                      <span>Efectivo esperado en caja</span>
                      <span>${closeSummary.expectedCash.toLocaleString("es-AR")}</span>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: "13px", color: "#737373", marginBottom: "16px" }}>Calculando totales...</p>
                )}

                <label style={{ fontSize: "11px", color: "#A3A3A3", textTransform: "uppercase", letterSpacing: "0.06em" }}>Efectivo contado en caja</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={closingCountInput}
                  onChange={(e) => setClosingCountInput(e.target.value)}
                  placeholder="0"
                  style={{ width: "100%", padding: "12px", fontSize: "16px", fontWeight: "700", border: "1px solid #E8E8E8", borderRadius: "8px", marginTop: "6px", marginBottom: "16px" }}
                />

                {closeError && (
                  <p style={{ color: "#DC2626", fontSize: "13px", marginBottom: "16px" }}>{closeError}</p>
                )}

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => setShowCloseModal(false)}
                    disabled={closingCash}
                    style={{ flex: 1, padding: "12px", fontSize: "13px", fontWeight: "600", backgroundColor: "white", color: "#737373", border: "1px solid #E8E8E8", borderRadius: "8px", cursor: "pointer" }}
                  >
                    Volver
                  </button>
                  <button
                    onClick={closeCashRegister}
                    disabled={closingCash}
                    style={{ flex: 2, padding: "12px", fontSize: "13px", fontWeight: "700", backgroundColor: "#0A0A0A", color: "white", border: "none", borderRadius: "8px", cursor: closingCash ? "default" : "pointer", opacity: closingCash ? 0.6 : 1 }}
                  >
                    {closingCash ? "Cerrando..." : "Cerrar caja"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px" }}>Caja cerrada</h2>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                  <span>Esperado</span>
                  <span style={{ fontWeight: "600" }}>${closeResult.expectedCash.toLocaleString("es-AR")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                  <span>Contado</span>
                  <span style={{ fontWeight: "600" }}>${closeResult.counted.toLocaleString("es-AR")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "20px", paddingTop: "8px", borderTop: "1px solid #E8E8E8" }}>
                  <span style={{ fontWeight: "700" }}>Diferencia</span>
                  <span style={{ fontWeight: "700", color: closeResult.difference === 0 ? "#16A34A" : "#DC2626" }}>
                    {closeResult.difference > 0 ? "+" : ""}${closeResult.difference.toLocaleString("es-AR")}
                  </span>
                </div>
                <button
                  onClick={finishClosing}
                  style={{ width: "100%", padding: "14px", fontSize: "14px", fontWeight: "700", backgroundColor: "#0A0A0A", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}
                >
                  Listo
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .pos-container { flex-direction: column; height: auto !important; min-height: 100vh; }
          .pos-scan-panel { padding: 16px !important; }
          .pos-cart-panel { width: 100% !important; border-left: none !important; border-top: 1px solid #E8E8E8; }
        }
      `}</style>
    </div>
  );
}
