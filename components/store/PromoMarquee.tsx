// Icono de camion de reparto (linea, mismo lenguaje visual que los demas
// iconos del sitio) para el mensaje de envio gratis.
function TruckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "8px", flexShrink: 0 }}>
      <path d="M3 16V6a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v10" />
      <path d="M14 9h4l3 3.5V16h-7" />
      <circle cx="7" cy="18" r="1.8" />
      <circle cx="17.5" cy="18" r="1.8" />
      <path d="M3 16h2.2M9.3 16h6" />
    </svg>
  );
}

const MESSAGES: { text: string; icon?: React.ReactNode }[] = [
  { text: "ENVÍOS GRATIS superando los $180.000", icon: <TruckIcon /> },
  { text: "10% OFF pagando por TRANSFERENCIA" },
  { text: "PAGÁ HASTA EN 3 CUOTAS SIN INTERÉS con Visa, Mastercard y Amex" },
];

// Carrusel infinito de mensajes promocionales, arriba de todo el sitio.
// Se duplica el grupo de mensajes una vez y se anima con translateX(-50%)
// para que el loop sea continuo sin ningun salto ni corte.
export default function PromoMarquee() {
  return (
    <div style={{ backgroundColor: "white", borderBottom: "1px solid #E8E8E8", overflow: "hidden" }}>
      <div className="promo-marquee-track">
        {[0, 1].map((copy) => (
          <div key={copy} className="promo-marquee-group" aria-hidden={copy === 1}>
            {MESSAGES.map((msg, i) => (
              <span key={i} className="promo-marquee-item">
                {msg.text}
                {msg.icon}
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
          color: #0A0A0A;
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
