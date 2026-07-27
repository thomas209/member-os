"use client";
import { useMemo, useState } from "react";

type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  tags: string[];
};

type Props = {
  recipientCount: number;
  customers: Customer[];
};

const inputStyle: React.CSSProperties = { width: "100%", padding: "12px", border: "1px solid #D1D1D1", fontSize: "14px", outline: "none", backgroundColor: "white", fontFamily: "inherit" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#737373", marginBottom: "8px" };

export default function CampaignComposer({ recipientCount, customers }: Props) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [buttonText, setButtonText] = useState("Ver oferta");
  const [buttonUrl, setButtonUrl] = useState("");
  const [testEmail, setTestEmail] = useState("");

  // Destinatarios: por defecto todos los clientes con mail. Si el usuario
  // activa "Selección personalizada" elige a mano (o filtrando por tag)
  // a quien mandarle, en vez de disparar siempre a toda la base.
  const [audienceMode, setAudienceMode] = useState<"all" | "custom">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [customerSearch, setCustomerSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const [sendingTest, setSendingTest] = useState(false);
  const [sendingAll, setSendingAll] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => c.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    return customers.filter((c) => {
      if (activeTag && !c.tags.includes(activeTag)) return false;
      if (!q) return true;
      const name = (c.firstName + " " + c.lastName).toLowerCase();
      return name.includes(q) || c.email.toLowerCase().includes(q);
    });
  }, [customers, customerSearch, activeTag]);

  const toggleCustomer = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredCustomers.forEach((c) => next.add(c.id));
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const effectiveRecipientCount = audienceMode === "all" ? recipientCount : selectedIds.size;

  const canSend = title.trim().length > 0 && message.trim().length > 0 && (audienceMode === "all" || selectedIds.size > 0);

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
          customerIds: mode === "all" && audienceMode === "custom" ? Array.from(selectedIds) : undefined,
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
      "Esto va a mandar el mail a " + effectiveRecipientCount + " " +
        (audienceMode === "all" ? "clientes registrados con email" : "clientes seleccionados") + ". ¿Confirmás?"
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

        <div style={{ borderTop: "1px solid #E8E8E8", paddingTop: "20px", marginBottom: "20px" }}>
          <label style={labelStyle}>Destinatarios</label>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <button
              onClick={() => setAudienceMode("all")}
              style={{
                flex: 1, padding: "10px", fontSize: "12px", fontWeight: 600,
                border: audienceMode === "all" ? "1px solid #0A0A0A" : "1px solid #D1D1D1",
                backgroundColor: audienceMode === "all" ? "#0A0A0A" : "white",
                color: audienceMode === "all" ? "white" : "#525252", cursor: "pointer",
              }}
            >
              Todos ({recipientCount})
            </button>
            <button
              onClick={() => setAudienceMode("custom")}
              style={{
                flex: 1, padding: "10px", fontSize: "12px", fontWeight: 600,
                border: audienceMode === "custom" ? "1px solid #0A0A0A" : "1px solid #D1D1D1",
                backgroundColor: audienceMode === "custom" ? "#0A0A0A" : "white",
                color: audienceMode === "custom" ? "white" : "#525252", cursor: "pointer",
              }}
            >
              Selección personalizada {selectedIds.size > 0 ? "(" + selectedIds.size + ")" : ""}
            </button>
          </div>

          {audienceMode === "custom" && (
            <div style={{ border: "1px solid #E8E8E8" }}>
              <div style={{ padding: "10px", borderBottom: "1px solid #E8E8E8", display: "flex", gap: "8px" }}>
                <input
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Buscar por nombre o mail..."
                  style={{ ...inputStyle, padding: "8px 10px", fontSize: "13px" }}
                />
              </div>

              {allTags.length > 0 && (
                <div style={{ padding: "10px", borderBottom: "1px solid #E8E8E8", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => setActiveTag(null)}
                    style={{
                      fontSize: "11px", fontWeight: 600, padding: "4px 10px", cursor: "pointer",
                      border: !activeTag ? "1px solid #0A0A0A" : "1px solid #D1D1D1",
                      backgroundColor: !activeTag ? "#0A0A0A" : "white", color: !activeTag ? "white" : "#525252",
                    }}
                  >
                    Todos los tags
                  </button>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                      style={{
                        fontSize: "11px", fontWeight: 600, padding: "4px 10px", cursor: "pointer",
                        border: activeTag === tag ? "1px solid #0A0A0A" : "1px solid #D1D1D1",
                        backgroundColor: activeTag === tag ? "#0A0A0A" : "white", color: activeTag === tag ? "white" : "#525252",
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ padding: "8px 10px", borderBottom: "1px solid #E8E8E8", display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                <button onClick={selectAllFiltered} style={{ background: "none", border: "none", color: "#0A0A0A", fontWeight: 600, cursor: "pointer", padding: 0 }}>
                  Seleccionar {filteredCustomers.length} filtrados
                </button>
                <button onClick={clearSelection} style={{ background: "none", border: "none", color: "#737373", cursor: "pointer", padding: 0 }}>
                  Vaciar selección
                </button>
              </div>

              <div style={{ maxHeight: "220px", overflowY: "auto" }}>
                {filteredCustomers.length === 0 && (
                  <p style={{ padding: "16px", fontSize: "12px", color: "#A3A3A3", textAlign: "center" }}>Sin resultados</p>
                )}
                {filteredCustomers.map((c) => (
                  <label
                    key={c.id}
                    style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderBottom: "1px solid #F4F4F4", cursor: "pointer", fontSize: "13px" }}
                  >
                    <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleCustomer(c.id)} />
                    <span style={{ flex: 1 }}>
                      {(c.firstName + " " + c.lastName).trim() || "(sin nombre)"}
                      <span style={{ color: "#A3A3A3" }}> — {c.email}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
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
          {sendingAll ? "Enviando..." : "Enviar a " + effectiveRecipientCount + " " + (audienceMode === "all" ? "clientes registrados" : "clientes seleccionados")}
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
            <span style={{ display: "inline-block", backgroundColor: "white", borderRadius: "14px", padding: "12px 16px", lineHeight: 0 }}>
              <img
                src="https://res.cloudinary.com/dklvmlzds/image/upload/v1783912898/MEMBER_B_1_3_wyfasx.png"
                alt="Member Club"
                style={{ height: "28px", width: "auto", display: "block" }}
              />
            </span>
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
