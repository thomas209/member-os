"use client";
import { useEffect, useState } from "react";
import InstagramPreview from "./InstagramPreview";
import StoryPreview from "./StoryPreview";

type Account = { handle: string | null; picture: string | null; status: string };

const card: React.CSSProperties = { border: "1px solid #E5E5E5", borderRadius: "12px", padding: "24px", marginBottom: "24px", background: "white" };
const label: React.CSSProperties = { display: "block", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#737373", marginBottom: "6px" };
const input: React.CSSProperties = { width: "100%", border: "1px solid #E5E5E5", borderRadius: "8px", padding: "10px 12px", fontSize: "14px", fontFamily: "inherit", marginBottom: "16px" };
const btn: React.CSSProperties = { background: "#0A0A0A", color: "white", border: "none", borderRadius: "8px", padding: "10px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer" };
const btnGhost: React.CSSProperties = { ...btn, background: "white", color: "#0A0A0A", border: "1px solid #E5E5E5" };

// Anuncios (horarios, feriados, avisos): solo el texto de Tommy + logo real.
export default function AnnouncementStudio({ account }: { account: Account | null }) {
  const [text, setText] = useState("");
  const [titulo, setTitulo] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [lineas, setLineas] = useState("");
  const [tema, setTema] = useState<"claro" | "oscuro">("claro");
  const [format, setFormat] = useState<"story" | "post">("story");
  const [layout, setLayout] = useState<string>("tabla");
  const [presets, setPresets] = useState<{ id: string; nombre: string; titulo: string; subtitulo?: string; lineas: string[] }[]>([]);
  useEffect(() => {
    fetch("/api/admin/social/announcement/presets").then((r) => (r.ok ? r.json() : { presets: [] })).then((d) => setPresets(d.presets || []));
  }, []);
  const LAYOUTS: [string, string][] = [["tabla", "Tabla"], ["centrado", "Centrado"], ["bloques", "Bloques"], ["poster", "Póster"]];
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{ postId: string; url: string } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const data = { titulo, subtitulo, lineas: lineas.split("\n").map((l) => l.trim()).filter(Boolean) };
  const encoded = typeof window !== "undefined" ? btoa(unescape(encodeURIComponent(JSON.stringify(data)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : "";
  const previewUrl = (l: string, t: string = tema) => `/api/admin/social/announcement/image?d=${encoded}&format=${format}&tema=${t}&layout=${l}`;

  async function order() {
    setBusy("Ordenando…");
    setError("");
    try {
      const res = await fetch("/api/admin/social/announcement/format", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Error");
      setTitulo(d.titulo || "");
      setSubtitulo(d.subtitulo || "");
      setLineas((d.lineas || []).join("\n"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy("");
    }
  }

  async function openPreview() {
    setBusy("Preparando…");
    setError("");
    setDone(null);
    setConfirming(false);
    try {
      if (format === "post" && !caption.trim()) throw new Error("Escribí el texto de la publicación");
      const s = await fetch("/api/admin/social/announcement/save", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ announcement: data, format, tema, layout }) });
      const sd = await s.json();
      if (!s.ok) throw new Error(sd.error || "Error");
      const p = await fetch("/api/admin/social/posts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: format, productIds: [], mediaUrls: [sd.url], caption }) });
      const pd = await p.json();
      if (!p.ok) throw new Error(pd.error || "Error");
      setPreview({ postId: pd.post.id, url: sd.url });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy("");
    }
  }

  async function publish() {
    if (!preview) return;
    setBusy("Publicando…");
    setError("");
    try {
      const res = await fetch(`/api/admin/social/posts/${preview.postId}/publish`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ confirm: true }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Error");
      setDone(d.post.permalink || "ok");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy("");
      setConfirming(false);
    }
  }

  return (
    <section style={card}>
      <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>Anuncio (horarios, feriados, avisos)</h2>
      <p style={{ fontSize: "13px", color: "#737373", marginBottom: "20px" }}>
        Escribí la info como te salga. La IA solo la ordena en título y renglones: no agrega nada. Todo es editable antes de armar la imagen.
      </p>
      {presets.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <label style={label}>Completar con los datos del local</label>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {presets.map((p) => (
              <button key={p.id} style={btnGhost} onClick={() => { setTitulo(p.titulo); setSubtitulo(p.subtitulo || ""); setLineas(p.lineas.join("\n")); setPreview(null); }}>
                {p.nombre}
              </button>
            ))}
          </div>
          <p style={{ fontSize: "12px", color: "#737373", marginTop: "6px" }}>Salen de los datos del local que publica la web (/stores). O escribí algo nuevo abajo.</p>
        </div>
      )}
      <textarea style={{ ...input, minHeight: "90px" }} value={text} onChange={(e) => setText(e.target.value)}
        placeholder="Ej: horarios de verano lunes a sabado 10 a 13 y 17 a 22, domingos 17 a 22" />
      <button style={{ ...btnGhost, marginBottom: "20px" }} disabled={!text.trim() || !!busy} onClick={order}>{busy === "Ordenando…" ? busy : "Ordenar con IA"}</button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div><label style={label}>Título</label><input style={input} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="HORARIOS" /></div>
        <div><label style={label}>Subtítulo (opcional)</label><input style={input} value={subtitulo} onChange={(e) => setSubtitulo(e.target.value)} placeholder="Temporada de verano" /></div>
      </div>
      <label style={label}>Renglones (uno por línea · “Clave: valor” se alinea en dos columnas)</label>
      <textarea style={{ ...input, minHeight: "120px", fontFamily: "monospace" }} value={lineas} onChange={(e) => setLineas(e.target.value)}
        placeholder={"Lunes a sábado: 10 a 13 y 17 a 22 h\nDomingos: 17 a 22 h"} />

      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
        {(["story", "post"] as const).map((f) => <button key={f} style={format === f ? btn : btnGhost} onClick={() => { setFormat(f); setPreview(null); }}>{f === "story" ? "Historia (9:16)" : "Publicación (4:5)"}</button>)}
        <span style={{ width: "12px" }} />
        {(["claro", "oscuro"] as const).map((t) => <button key={t} style={tema === t ? btn : btnGhost} onClick={() => { setTema(t); setPreview(null); }}>{t === "claro" ? "Fondo blanco" : "Fondo negro"}</button>)}
      </div>

      {titulo && (
        <div style={{ marginBottom: "16px" }}>
          <label style={label}>Elegí un diseño</label>
          <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "6px" }}>
            {LAYOUTS.map(([id, name]) => (
              <button key={id} onClick={() => { setLayout(id); setPreview(null); }}
                style={{ flex: "0 0 auto", border: layout === id ? "2px solid #0A0A0A" : "1px solid #E5E5E5", borderRadius: "10px", padding: "6px", background: "white", cursor: "pointer", textAlign: "center" }}>
                <img src={previewUrl(id)} alt="" style={{ width: "160px", aspectRatio: format === "story" ? "9 / 16" : "4 / 5", borderRadius: "6px", display: "block" }} />
                <div style={{ fontSize: "12px", marginTop: "6px", fontWeight: layout === id ? 700 : 400 }}>{name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {format === "post" && (
        <>
          <label style={label}>Texto de la publicación</label>
          <textarea style={{ ...input, minHeight: "80px" }} value={caption} onChange={(e) => setCaption(e.target.value)} />
        </>
      )}

      {error && <p style={{ color: "#DC2626", fontSize: "13px", marginBottom: "12px" }}>{error}</p>}

      {account && titulo && (
        <button style={{ ...btn, opacity: busy ? 0.4 : 1 }} disabled={!!busy} onClick={openPreview}>
          {busy === "Preparando…" ? busy : format === "story" ? "👀 Ver cómo queda la historia" : "👀 Ver cómo queda en Instagram"}
        </button>
      )}

      {preview && account && (
        <div style={{ display: "flex", gap: "32px", alignItems: "flex-start", marginTop: "20px", flexWrap: "wrap" }}>
          {format === "story" ? (
            <StoryPreview handle={account.handle || ""} picture={account.picture} images={[preview.url]} />
          ) : (
            <InstagramPreview handle={account.handle || ""} picture={account.picture} images={[preview.url]} caption={caption} />
          )}
          <div style={{ maxWidth: "340px", fontSize: "13px", lineHeight: 1.6 }}>
            {done ? (
              <p style={{ color: "#16A34A", fontWeight: 600 }}>✓ Publicado en @{account.handle}. {done.startsWith("http") && <a href={done} target="_blank" rel="noreferrer">Ver en Instagram →</a>}</p>
            ) : !confirming ? (
              <button style={btn} onClick={() => setConfirming(true)}>Dar OK para publicar</button>
            ) : (
              <>
                <p style={{ marginBottom: "12px", color: "#B45309" }}>Se va a publicar <b>ahora</b>{format === "story" ? " como historia" : ""} en <b>@{account.handle}</b>.</p>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button style={{ ...btn, background: "#16A34A" }} disabled={!!busy} onClick={publish}>{busy === "Publicando…" ? busy : "Confirmar y publicar"}</button>
                  <button style={btnGhost} disabled={!!busy} onClick={() => setConfirming(false)}>Cancelar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
