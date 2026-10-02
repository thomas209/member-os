"use client";
import CopyButton from "@/components/store/CopyButton";
import { buildWhatsappLink } from "@/lib/whatsapp";

// Tarjeta "Seguimiento" en el detalle de un pedido: el link a la pagina publica
// de seguimiento (con la estetica de la marca) y el boton para mandarselo al
// cliente por WhatsApp con el mensaje ya escrito. Mismo criterio que ShareReceipt.
export default function ShareTracking({
  trackingUrl,
  orderNumber,
  status,
  guestFirstName,
  guestPhone,
  trackingNumbers,
}: {
  trackingUrl: string;
  orderNumber: number;
  status: string;
  guestFirstName: string | null;
  guestPhone: string | null;
  trackingNumbers: string[];
}) {
  const nro = "#" + String(orderNumber).padStart(4, "0");
  const hola = "¡Hola" + (guestFirstName ? " " + guestFirstName : "") + "!";
  const despachado = trackingNumbers.length > 0;

  const mensaje =
    status === "DELIVERED"
      ? `${hola} Tu pedido ${nro} de Member Club figura como entregado 🙌 ¡Que lo disfrutes! Cualquier cosa, escribinos.\n${trackingUrl}`
      : despachado
      ? `${hola} Tu pedido ${nro} de Member Club ya salió 🚀\n\n` +
        `N° de seguimiento: ${trackingNumbers.join(" / ")}\n` +
        `Seguilo en vivo acá 👇\n${trackingUrl}`
      : `${hola} Te paso el link para seguir el estado de tu pedido ${nro} de Member Club 👇\n${trackingUrl}`;

  const whatsappLink = guestPhone ? buildWhatsappLink(guestPhone, mensaje) : null;

  return (
    <div style={{ backgroundColor: "white", border: "1px solid #E8E8E8", padding: "24px", marginBottom: "16px" }}>
      <h2 style={{ fontSize: "12px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "#737373", marginBottom: "16px" }}>
        Seguimiento
      </h2>

      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        <input
          readOnly
          value={trackingUrl}
          onFocus={(e) => e.target.select()}
          style={{ flex: 1, minWidth: 0, padding: "8px 10px", fontSize: "12px", color: "#525252", border: "1px solid #E8E8E8", backgroundColor: "#FAFAFA" }}
        />
        <CopyButton value={trackingUrl} />
      </div>
      <p style={{ fontSize: "11px", color: "#A3A3A3", marginBottom: "16px" }}>
        {despachado
          ? "Página de seguimiento del pedido, con el número de Andreani. Se actualiza sola cuando cambia el estado."
          : "Página de seguimiento del pedido. Cuando lo despaches, ahí va a aparecer el número de Andreani."}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {whatsappLink ? (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textAlign: "center", padding: "10px 14px", fontSize: "12px", fontWeight: "700", backgroundColor: "#16A34A", color: "white", textDecoration: "none" }}
          >
            {despachado ? "Avisar por WhatsApp que ya salió 🚀" : "Enviar seguimiento por WhatsApp"}
          </a>
        ) : (
          <p style={{ fontSize: "11px", color: "#A3A3A3" }}>Sin telefono cargado, no se puede armar el link de WhatsApp.</p>
        )}
        <a
          href={trackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textAlign: "center", padding: "10px 14px", fontSize: "12px", fontWeight: "600", border: "1px solid #0A0A0A", backgroundColor: "white", color: "#0A0A0A", textDecoration: "none" }}
        >
          Ver la página como la ve el cliente
        </a>
      </div>
    </div>
  );
}
