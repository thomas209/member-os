"use client";
import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";

type ProductResult = {
  name: string;
  brand: string;
  price: number;
  onSale: number | null;
  image: string | null;
  url: string;
  sizesInStock: string[];
};

function formatPrice(n: number) {
  return "$" + n.toLocaleString("es-AR");
}

// Tarjetas de producto cuando la tool search_products devuelve resultados.
// El resto del contenido del chat (texto del asistente, confirmaciones)
// se renderiza como texto simple.
function ProductResults({ products }: { products: ProductResult[] }) {
  if (!products.length) return null;
  return (
    <div style={{ display: "flex", gap: "10px", overflowX: "auto", padding: "4px 0 8px 0" }}>
      {products.map((p) => (
        <a
          key={p.url}
          href={p.url}
          target="_blank"
          rel="noreferrer"
          style={{
            flex: "0 0 130px", textDecoration: "none", color: "#0A0A0A",
            border: "1px solid #E8E8E8", background: "white",
          }}
        >
          {p.image ? (
            <img src={p.image} alt={p.name} style={{ width: "130px", height: "160px", objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{ width: "130px", height: "160px", background: "#F4F4F4" }} />
          )}
          <div style={{ padding: "8px" }}>
            <p style={{ fontSize: "10px", color: "#737373", letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 2px 0" }}>{p.brand}</p>
            <p style={{ fontSize: "12px", margin: "0 0 4px 0", lineHeight: 1.3 }}>{p.name}</p>
            <p style={{ fontSize: "12px", fontWeight: 700, margin: 0 }}>
              {formatPrice(p.onSale ?? p.price)}
            </p>
          </div>
        </a>
      ))}
    </div>
  );
}

export default function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status === "streaming" || status === "submitted") return;
    sendMessage({ text: input.trim() });
    setInput("");
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setUploadError("Solo imagenes"); return; }
    if (file.size > 20 * 1024 * 1024) { setUploadError("Maximo 20MB"); return; }

    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "member-os/quote-requests");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { setUploadError(data.error || "Error al subir"); setUploading(false); return; }
      sendMessage({ text: "Te mando la foto de lo que estoy buscando: " + data.url });
      setUploading(false);
    } catch {
      setUploadError("Error de conexion");
      setUploading(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      {/* Boton flotante */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Asistente de compra"
        style={{
          position: "fixed", bottom: "20px", right: "20px", zIndex: 70,
          width: "52px", height: "52px", borderRadius: "50%",
          backgroundColor: "#0A0A0A", color: "white", border: "none",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
        }}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          style={{
            position: "fixed", bottom: "84px", right: "20px", zIndex: 70,
            width: "min(360px, calc(100vw - 32px))", height: "min(520px, calc(100vh - 140px))",
            backgroundColor: "white", border: "1px solid #E8E8E8",
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            display: "flex", flexDirection: "column",
          }}
        >
          <div style={{ padding: "16px 18px", borderBottom: "1px solid #F4F4F4" }}>
            <p style={{ fontFamily: "Georgia, serif", fontSize: "15px", margin: 0 }}>Asistente Member Club</p>
            <p style={{ fontSize: "11px", color: "#A3A3A3", margin: "2px 0 0 0" }}>Preguntame por productos o mandame lo que buscas</p>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {messages.length === 0 && (
              <p style={{ fontSize: "13px", color: "#A3A3A3" }}>
                Hola, ¿qué estás buscando? Contame marca, talle o presupuesto y te muestro opciones del catálogo.
              </p>
            )}

            {messages.map((message) => (
              <div key={message.id} style={{ alignSelf: message.role === "user" ? "flex-end" : "flex-start", maxWidth: "88%" }}>
                {message.parts.map((part, i) => {
                  if (part.type === "text") {
                    return (
                      <div
                        key={i}
                        style={{
                          fontSize: "13px", lineHeight: 1.45, padding: "9px 12px",
                          backgroundColor: message.role === "user" ? "#0A0A0A" : "#F4F4F4",
                          color: message.role === "user" ? "white" : "#0A0A0A",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {part.text}
                      </div>
                    );
                  }
                  if (part.type === "tool-search_products") {
                    if (part.state === "output-available") {
                      const output = part.output as { found: boolean; products?: ProductResult[] };
                      if (output.found && output.products) {
                        return <ProductResults key={i} products={output.products} />;
                      }
                      return null;
                    }
                    return (
                      <p key={i} style={{ fontSize: "11px", color: "#A3A3A3", fontStyle: "italic", margin: "4px 0" }}>
                        Buscando en el catálogo...
                      </p>
                    );
                  }
                  if (part.type === "tool-create_quote_request" && part.state !== "output-available") {
                    return (
                      <p key={i} style={{ fontSize: "11px", color: "#A3A3A3", fontStyle: "italic", margin: "4px 0" }}>
                        Guardando tu solicitud...
                      </p>
                    );
                  }
                  return null;
                })}
              </div>
            ))}

            {status === "submitted" && (
              <p style={{ fontSize: "11px", color: "#A3A3A3", fontStyle: "italic" }}>Escribiendo...</p>
            )}
            <div ref={bottomRef} />
          </div>

          {uploadError && <p style={{ fontSize: "11px", color: "#DC2626", padding: "0 16px" }}>{uploadError}</p>}

          <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px", padding: "12px 14px", borderTop: "1px solid #F4F4F4" }}>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFile} style={{ display: "none" }} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              aria-label="Adjuntar foto"
              style={{ background: "none", border: "1px solid #E8E8E8", width: "34px", cursor: "pointer", color: "#525252", flexShrink: 0 }}
            >
              {uploading ? "…" : "+"}
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribí tu consulta..."
              style={{ flex: 1, border: "1px solid #E8E8E8", padding: "8px 10px", fontSize: "13px", outline: "none" }}
            />
            <button
              type="submit"
              disabled={status === "streaming" || status === "submitted"}
              style={{ backgroundColor: "#0A0A0A", color: "white", border: "none", padding: "0 14px", fontSize: "12px", cursor: "pointer", flexShrink: 0 }}
            >
              Enviar
            </button>
          </form>
        </div>
      )}
    </>
  );
}
