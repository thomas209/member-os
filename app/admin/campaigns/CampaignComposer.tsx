"use client";
import { useState } from "react";

type Props = {
  recipientCount: number;
};

const inputStyle: React.CSSProperties = { width: "100%", padding: "12px", border: "1px solid #D1D1D1", fontSize: "14px", outline: "none", backgroundColor: "white", fontFamily: "inherit" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#737373", marginBottom: "8px" };

export default function CampaignComposer({ recipientCount }: Props) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [buttonText, setButtonText] = useState("Ver oferta");
  const [buttonUrl, setButtonUrl] = useState("");
  const [testEmail, setTestEmail] = useState("");

  const [sendingTest, setSendingTest] = useState(false);
  const [sendingAll, setSendingAll] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const canSend = title.trim().length > 0 && message.trim().length > 0;

  const send = async (mode: "test" | "all") => {
    setResult(null);
    if (mode === "test") setSendingTest(true);
    else setSendingAll(true);

    try {
      const res = await fetch("/api/admin/campaigns/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          message,
          imageUrl: imageUrl || undefined,
          buttonText: buttonText || undefined,
          buttonUrl: buttonUrl || undefined,
          testEmail: mode === "test" ? testEmail : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, text: data.error || "Error al enviar" });
      } else if (mode === "test") {
        setResult({ ok: true, text: "Mail de prueba enviado a " + testEmail });
      } else {
        setResult({ ok: true, text: "Enviado a " + data.sent + " de " + data.total + " clientes" + (data.failed ? " (" + data.failed + " fallaron)" : "") });
      }
    } catch {
      setResult({ ok: false, text: "Error de conexion" });
    }

    setSendingTest(false);
    setSendingAll(false);
  };

  const handleSendTest = () => {
    if (!testEmail.trim()) {
      setResult({ ok: false, text: "Cargá un email para la prueba" });
      return;
    }
    send("test");
  };

  const handleSendAll = () => {
    const confirmed = window.confirm(
      "Esto va a mandar el mail a los " + recipientCount + " clientes registrados con email. ¿Confirmás?"
    );
    if (confirmed) send("all");
  };

  const messageLines = message.split("\n").filter((p) => p.trim().length > 0);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
      {/* Formulario */}
      <div style={{ backgroundColor: "white", padding: "24px", border: "1px solid #E8E8E8" }}>
        <h2 style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "20px" }}>Contenido del mail</h2>

        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Título *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="20% off en toda la coleccion" style={inputStyle} />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Imagen destacada (URL, opcional)</label>
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." style={inputStyle} />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Mensaje *</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} placeholder="Contales la oferta. Cada renglon nuevo es un parrafo aparte." style={{ ...inputStyle, resize: "vertical" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
          <div>
            <label style={labelStyle}>Texto del botón</label>
            <input value={buttonText} onChange={(e) => setButtonText(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Link del botón</label>
            <input value={buttonUrl} onChange={(e) => setButtonUrl(e.target.value)} placeholder="https://tu-sitio.com/catalog" style={inputStyle} />
          </div>
        </div>

        <div style={{ borderTop: "1px solid #E8E8E8", paddingTop: "20px", marginBottom: "16px" }}>
          <label style={labelStyle}>Enviar de prueba a</label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="tu-email@gmail.com" style={inputStyle} />
            <button
              onClick={handleSendTest}
              disabled={!canSend || sendingTest}
              style={{ padding: "0 20px", fontSize: "12px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", border: "1px solid #D1D1D1", backgroundColor: "white", whiteSpace: "nowrap", cursor: !canSend || sendingTest ? "not-allowed" : "pointer" }}
            >
              {sendingTest ? "Enviando..." : "Prueba"}
            </button>
          </div>
        </div>

        <button
          onClick={handleSendAll}
          disabled={!canSend || sendingAll}
          style={{ width: "100%", padding: "14px", backgroundColor: !canSend || sendingAll ? "#E8E8E8" : "#0A0A0A", color: !canSend || sendingAll ? "#A3A3A3" : "white", fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", border: "none", cursor: !canSend || sendingAll ? "not-allowed" : "pointer" }}
        >
          {sendingAll ? "Enviando..." : "Enviar a los " + recipientCount + " clientes registrados"}
        </button>

        {result && (
          <p style={{ marginTop: "16px", fontSize: "13px", color: result.ok ? "#16A34A" : "#DC2626" }}>{result.text}</p>
        )}
      </div>

      {/* Preview */}
      <div>
        <p style={labelStyle}>Vista previa</p>
        <div style={{ backgroundColor: "white", border: "1px solid #E8E8E8", overflow: "hidden" }}>
          <div style={{ backgroundColor: "#0A0A0A", padding: "24px", textAlign: "center" }}>
            <p style={{ color: "white", fontSize: "16px", letterSpacing: "0.05em", margin: 0 }}>Member Club</p>
          </div>
          {imageUrl && <img src={imageUrl} alt="" style={{ width: "100%", display: "block" }} />}
          <div style={{ padding: "32px" }}>
            <p style={{ fontSize: "19px", fontWeight: 700, marginBottom: "12px", color: title ? "#0A0A0A" : "#D1D1D1" }}>
              {title || "Título del mail"}
            </p>
            {messageLines.length === 0 ? (
              <p style={{ fontSize: "13px", color: "#D1D1D1" }}>Tu mensaje va a aparecer acá.</p>
            ) : (
              messageLines.map((line, i) => (
                <p key={i} style={{ fontSize: "13px", color: "#525252", marginBottom: "10px" }}>{line}</p>
              ))
            )}
            {buttonText && buttonUrl && (
              <div style={{ textAlign: "center", marginTop: "16px" }}>
                <span style={{ display: "inline-block", backgroundColor: "#0A0A0A", color: "white", padding: "10px 24px", fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {buttonText}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
