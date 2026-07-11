const MESSAGES = [
  "ENVÍOS GRATIS superando los $180.000",
  "10% OFF pagando por TRANSFERENCIA",
  "PAGÁ HASTA EN 3 CUOTAS SIN INTERÉS con Visa, Mastercard y Amex",
];

// Carrusel infinito de mensajes promocionales, arriba de todo el sitio.
// Se duplica el grupo de mensajes una vez y se anima con translateX(-50%)
// para que el loop sea continuo sin ningun salto ni corte.
export default function PromoMarquee() {
  return (
    <div style={{ backgroundColor: "#0A0A0A", overflow: "hidden" }}>
      <div className="promo-marquee-track">
        {[0, 1].map((copy) => (
          <div key={copy} className="promo-marquee-group" aria-hidden={copy === 1}>
            {MESSAGES.map((msg, i) => (
              <span key={i} className="promo-marquee-item">
                {msg}
              </span>
            ))}
          </div>
        ))}
      </div>

      <style>{`
        .promo-marquee-track {
          display: flex;
          width: max-content;
          animation: promo-marquee-scroll 30s linear infinite;
        }
        .promo-marquee-group {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }
        .promo-marquee-item {
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
          padding: 10px 20px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: white;
        }
        .promo-marquee-item::after {
          content: "🌟";
          margin-left: 20px;
          font-size: 11px;
        }
        @keyframes promo-marquee-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .promo-marquee-track { animation: none; }
        }
      `}</style>
    </div>
  );
}
