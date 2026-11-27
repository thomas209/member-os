// Tarjeta de la gift card (version provisoria hasta tener el diseño final).
export default function GiftCardVisual({ percent, small }: { percent: number; small?: boolean }) {
  return (
    <div style={{
      background: "#F6F0E4", borderRadius: small ? 18 : 26, padding: small ? 8 : 12,
      boxShadow: "0 18px 40px rgba(0,0,0,0.12)", transform: "rotate(-2deg)", maxWidth: 420, margin: "0 auto",
    }}>
      <div style={{ border: "1.5px solid #111", borderRadius: small ? 12 : 18, padding: small ? "18px 16px" : "28px 22px", textAlign: "center" }}>
        <p style={{ fontSize: 11, letterSpacing: "0.22em", fontWeight: 600, margin: 0 }}>MEMBER CLUB · GIFT CARD</p>
        <p className="precio" style={{ fontSize: small ? 46 : 64, fontWeight: 600, letterSpacing: "-0.03em", margin: "10px 0 6px", lineHeight: 1 }}>{percent}% OFF</p>
        <p style={{ fontSize: 11, letterSpacing: "0.18em", fontWeight: 600, margin: 0 }}>EN TU PRIMERA COMPRA</p>
        <p style={{ fontSize: 13, color: "#5A5A5A", margin: "6px 0 0" }}>pagando por transferencia</p>
      </div>
    </div>
  );
}
