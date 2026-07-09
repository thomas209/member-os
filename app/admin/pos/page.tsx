"use client";
import { useState, useRef, useEffect } from "react";

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
  qty: number;
};

export default function PosPage() {
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<ScannedItem | null>(null);
  const [cart, setCart] = useState<ScannedItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef<any>(null);
  const lastCodeRef = useRef<string>("");
  const lastScanTimeRef = useRef<number>(0);

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const lookupVariant = async (variantId: string) => {
    // Evitar procesar el mismo código repetido en menos de 2 segundos (la cámara lee varias veces por segundo)
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

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#F4F4F4" }}>
      {/* PANEL ESCANEO */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px", overflowY: "auto" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "20px" }}>Punto de venta</h1>

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
          <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "16px", display: "flex", gap: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            {lastScanned.image ? (
              <img src={lastScanned.image} alt={lastScanned.name} style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px" }} />
            ) : (
              <div style={{ width: "80px", height: "80px", backgroundColor: "#F4F4F4", borderRadius: "8px" }} />
            )}
            <div>
              <p style={{ fontSize: "11px", color: "#A3A3A3", textTransform: "uppercase", letterSpacing: "0.06em" }}>{lastScanned.brand}</p>
              <p style={{ fontSize: "16px", fontWeight: "700", marginBottom: "4px" }}>{lastScanned.name}</p>
              <p style={{ fontSize: "13px", color: "#737373" }}>
                Talle {lastScanned.size}
                {lastScanned.colorName ? " · " + lastScanned.colorName : ""}
              </p>
              <p style={{ fontSize: "13px", color: lastScanned.stock > 0 ? "#16A34A" : "#DC2626", fontWeight: "600" }}>
                Stock: {lastScanned.stock}
              </p>
              <p style={{ fontSize: "16px", fontWeight: "700", marginTop: "4px" }}>
                ${lastScanned.price.toLocaleString("es-AR")}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* PANEL CARRITO */}
      <div style={{ width: "380px", backgroundColor: "white", borderLeft: "1px solid #E8E8E8", display: "flex", flexDirection: "column" }}>
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
                  <p style={{ fontSize: "11px", color: "#737373" }}>Talle {item.size}</p>
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
    </div>
  );
}
