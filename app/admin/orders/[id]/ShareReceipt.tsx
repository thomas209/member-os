"use client";
import { useState } from "react";
import CopyButton from "@/components/store/CopyButton";
import { buildWhatsappLink } from "@/lib/whatsapp";

// Tarjeta de "Comprobante" en el detalle de un pedido: da las 3 formas de
// hacerselo llegar al cliente sin depender del mail automatico —
// WhatsApp (link de wa.me con el mensaje ya armado), reenvio de mail, y
// el link publico solo para copiar y pegar donde haga falta (ej: Instagram,
// que no tiene forma de mandar un link automatico desde aca).
export default function ShareReceipt({
  orderId,
  receiptUrl,
  guestFirstName,
  guestPhone,
  guestEmail,
}: {
  orderId: string;
  receiptUrl: string;
  guestFirstName: string | null;
  guestPhone: string | null;
  guestEmail: string | null;
}) {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const whatsappLink = guestPhone
    ? buildWhatsappLink(
        guestPhone,
        "Hola" + (guestFirstName ? " " + guestFirstName : "") + "! Te paso el comprobante de tu compra en Member Club: " + receiptUrl
      )
    : null;

  const handleResendEmail = async () => {
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/orders/" + orderId + "/resend-receipt", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, message: data.error || "No se pudo reenviar" });
      } else {
        setResult({ ok: true, message: "Mail reenviado" });
      }
    } catch {
      setResult({ ok: false, message: "Error de conexion" });
    }
    setSending(false);
  };

  return (
    <div style={{ backgroundColor: "white", border: "1px solid #E8E8E8", padding: "24px", marginBottom: "16px" }}>
      <h2 style={{ fontSize: "12px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "#737373", marginBottom: "16px" }}>
        Comprobante
      </h2>

      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        <input
          readOnly
          value={receiptUrl}
          onFocus={(e) => e.target.select()}
          style={{ flex: 1, minWidth: 0, padding: "8px 10px", fontSize: "12px", color: "#525252", border: "1px solid #E8E8E8", backgroundColor: "#FAFAFA" }}
        />
        <CopyButton value={receiptUrl} />
      </div>
      <p style={{ fontSize: "11px", color: "#A3A3A3", marginBottom: "16px" }}>
        Pegalo donde haga falta (ej: Instagram) para que el cliente vea y descargue su comprobante.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {whatsappLink ? (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textAlign: "center", padding: "10px 14px", fontSize: "12px", fontWeight: "700",
              backgroundColor: "#16A34A", color: "white", textDecoration: "none",
            }}
          >
            Enviar por WhatsApp
          </a>
        ) : (
          <p style={{ fontSize: "11px", color: "#A3A3A3" }}>Sin telefono cargado, no se puede armar el link de WhatsApp.</p>
        )}

        {guestEmail ? (
          <button
            onClick={handleResendEmail}
            disabled={sending}
            style={{
              padding: "10px 14px", fontSize: "12px", fontWeight: "600",
              border: "1px solid #0A0A0A", backgroundColor: "white", color: "#0A0A0A",
              cursor: sending ? "default" : "pointer", opacity: sending ? 0.6 : 1,
            }}
          >
            {sending ? "Enviando..." : "Reenviar por mail"}
          </button>
        ) : (
          <p style={{ fontSize: "11px", color: "#A3A3A3" }}>Sin mail cargado, no se puede reenviar por mail.</p>
        )}
      </div>

      {result && (
        <p style={{ fontSize: "12px", marginTop: "10px", color: result.ok ? "#16A34A" : "#DC2626" }}>{result.message}</p>
      )}
    </div>
  );
}
