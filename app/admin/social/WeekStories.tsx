"use client";
import { useEffect, useState } from "react";
import StoryPreview from "./StoryPreview";

// Historias de la semana: 7 dias con lo agendado/publicado y "+ Subir" para
// agregar una historia con foto o video propio (celu o compu).
type Post = { id: string; mediaUrls: string[]; mediaType: string; status: string; scheduledAt: string | null; publishedAt: string | null };
type Product = { id: string; name: string; brand: string; image: string | null; sizes: string[] };
type Account = { handle: string; picture: string | null };

const btn: React.CSSProperties = { background: "#0A0A0A", color: "white", border: "none", borderRadius: "10px", padding: "11px 16px", fontSize: "14px", fontWeight: 600, cursor: "pointer" };
const ghost: React.CSSProperties = { ...btn, background: "white", color: "#0A0A0A", border: "1px solid #E5E5E5" };
const chip = (on: boolean): React.CSSProperties => ({ padding: "9px 14px", borderRadius: "999px", fontSize: "13px", fontWeight: 600, cursor: "pointer", border: "1px solid " + (on ? "#0A0A0A" : "#E5E5E5"), background: on ? "#0A0A0A" : "white", color: on ? "white" : "#0A0A0A" });
const label: React.CSSProperties = { fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#737373", margin: "18px 0 8px", display: "block" };
const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const TAGS = ["", "NEW IN", "RESTOCK", "ULTIMOS TALLES", "SALE"];
const thumb = (u: string) => (u.includes("/video/upload/") ? u.replace(/\.(mp4|mov|webm)$/i, ".jpg") : u);
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const hhmm = (d: Date) => d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

export default function WeekStories({ posts, account, ready, onOpen, onChanged }: {
  posts: Post[]; account: Account | null; ready: boolean; onOpen: (p: Post) => void; onChanged: (msg: string) => void;
}) {
  const [adding, setAdding] = useState<Date | null>(null);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(today); d.setDate(d.getDate() + i); return d; });
  const stories = posts.filter((p) => p.mediaType === "story");

  return (
    <>
      <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "6px", scrollSnapType: "x mandatory" }}>
        {days.map((d) => {
          const items = stories
            .map((p) => ({ p, at: new Date((p.status === "published" ? p.publishedAt : p.scheduledAt) || 0) }))
            .filter((x) => sameDay(x.at, d))
            .sort((a, b) => +a.at - +b.at);
          return (
            <div key={d.toISOString()} style={{ flex: "0 0 132px", scrollSnapAlign: "start", background: "white", border: "1px solid #EDEDED", borderRadius: "14px", padding: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700 }}>
                {sameDay(d, today) ? "Hoy" : DAYS[d.getDay()]} <span style={{ color: "#A3A3A3", fontWeight: 500 }}>{d.getDate()}/{d.getMonth() + 1}</span>
              </div>
              {items.map(({ p, at }) => (
                <button key={p.id} onClick={() => onOpen(p)} style={{ padding: 0, border: "none", background: "none", cursor: "pointer", textAlign: "left" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumb(p.mediaUrls[0])} alt="" style={{ width: "100%", aspectRatio: "9/16", objectFit: "cover", borderRadius: "8px", display: "block", opacity: p.status === "published" ? 0.55 : 1 }} />
                  <div style={{ fontSize: "11px", color: p.status === "failed" || p.status === "paused" ? "#B91C1C" : "#525252", marginTop: "3px" }}>
                    {p.status === "published" ? "✓ " : ""}{hhmm(at)}{p.mediaUrls[0].includes("/video/upload/") ? " · video" : ""}
                  </div>
                </button>
              ))}
              <button disabled={!ready} onClick={() => setAdding(d)}
                style={{ border: "1px dashed #D4D4D4", borderRadius: "8px", background: "#FAFAFA", padding: "12px 4px", fontSize: "12px", fontWeight: 600, cursor: ready ? "pointer" : "not-allowed", color: "#525252" }}>
                + Subir
              </button>
            </div>
          );
        })}
      </div>
      {adding && account && (
        <Uploader day={adding} account={account} onClose={() => setAdding(null)} onDone={(m) => { setAdding(null); onChanged(m); }} />
      )}
    </>
  );
}

// Sube directo a Cloudinary (con firma del server) mostrando el progreso.
function uploadToCloudinary(file: File, onProgress: (n: number) => void): Promise<{ publicId: string; kind: "image" | "video" }> {
  return new Promise(async (resolve, reject) => {
    try {
      const kind = file.type.startsWith("video/") ? "video" : "image";
      const s = await (await fetch("/api/admin/social/media/sign", { method: "POST" })).json();
      if (!s.signature) throw new Error(s.error || "No se pudo preparar la subida");
      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", s.apiKey);
      fd.append("timestamp", String(s.timestamp));
      fd.append("folder", s.folder);
      fd.append("signature", s.signature);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${s.cloudName}/${kind}/upload`);
      xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
      xhr.onload = () => {
        const j = JSON.parse(xhr.responseText || "{}");
        if (xhr.status >= 200 && xhr.status < 300 && j.public_id) resolve({ publicId: j.public_id, kind });
        else reject(new Error(j.error?.message || "Cloudinary rechazó el archivo"));
      };
      xhr.onerror = () => reject(new Error("Se cortó la subida. Probá de nuevo."));
      xhr.send(fd);
    } catch (e) { reject(e); }
  });
}

export function Uploader({ day, account, onClose, onDone }: { day: Date; account: Account; onClose: () => void; onDone: (m: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [localUrl, setLocalUrl] = useState("");
  const [uploaded, setUploaded] = useState<{ publicId: string; kind: "image" | "video" } | null>(null);
  const [progress, setProgress] = useState(0);
  const [mode, setMode] = useState<"raw" | "brand" | "product">("brand");
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [tag, setTag] = useState("");
  const [time, setTime] = useState("20:00");
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState<"" | "upload" | "build" | "schedule">("");
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => { setIsMobile(window.innerWidth < 640); }, []);
  useEffect(() => () => { if (localUrl) URL.revokeObjectURL(localUrl); }, [localUrl]);
  useEffect(() => {
    if (mode !== "product") return;
    const t = setTimeout(() => {
      fetch("/api/admin/social/products?q=" + encodeURIComponent(q)).then((r) => r.json()).then((j) => setProducts(j.products || [])).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [q, mode]);
  // Cualquier cambio invalida la vista previa armada.
  useEffect(() => { setPreview(""); }, [mode, text, product, tag, uploaded]);

  async function pick(f: File | undefined) {
    if (!f) return;
    setError(""); setUploaded(null); setPreview("");
    if (f.type.startsWith("video/") && f.size > 100 * 1024 * 1024) return setError("El video pesa más de 100 MB. Recortalo o bajale la calidad.");
    if (!f.type.startsWith("video/") && !f.type.startsWith("image/")) return setError("Subí una foto o un video");
    setFile(f);
    setLocalUrl(URL.createObjectURL(f));
    setBusy("upload"); setProgress(0);
    try { setUploaded(await uploadToCloudinary(f, setProgress)); }
    catch (e) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setBusy(""); }
  }

  async function call(body: object) {
    const r = await fetch("/api/admin/social/own-story", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "Error");
    return j;
  }

  async function build() {
    if (!uploaded) return;
    setBusy("build"); setError("");
    try {
      const j = await call({ action: "build", ...uploaded, mode, text, productId: product?.id, tag: tag || null });
      setPreview(j.mediaUrl);
    } catch (e) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setBusy(""); }
  }

  const when = (() => { const [h, m] = time.split(":").map(Number); const d = new Date(day); d.setHours(h || 0, m || 0, 0, 0); return d; })();
  const past = +when < Date.now() + 60_000;

  async function schedule() {
    setBusy("schedule"); setError("");
    try {
      await call({ action: "schedule", confirm: true, mediaUrl: preview, productId: mode === "product" ? product?.id : undefined, scheduledAt: when.toISOString() });
      onDone(`Historia agendada para ${when.toLocaleString("es-AR", { weekday: "long", hour: "2-digit", minute: "2-digit" })}`);
    } catch (e) { setError(e instanceof Error ? e.message : "Error"); setBusy(""); }
  }

  const isVideo = file?.type.startsWith("video/");
  const canBuild = !!uploaded && !busy && (mode !== "product" || !!product);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 70, display: "flex", alignItems: isMobile ? "stretch" : "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: "white", width: isMobile ? "100%" : "min(860px, 94vw)", maxHeight: isMobile ? "100%" : "92vh", overflowY: "auto", borderRadius: isMobile ? 0 : "16px", padding: isMobile ? "16px 16px 32px" : "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "17px", fontWeight: 700 }}>Historia · {day.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "numeric" })}</div>
          <button onClick={onClose} style={{ border: "none", background: "none", fontSize: "22px", cursor: "pointer" }} aria-label="Cerrar">×</button>
        </div>

        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "24px", marginTop: "12px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={label}>1 · Foto o video</span>
            <label style={{ ...ghost, display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", width: "100%", boxSizing: "border-box" }}>
              {file ? "Cambiar archivo" : "📷 Elegir o sacar foto / video"}
              <input type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={(e) => pick(e.target.files?.[0])} />
            </label>
            {busy === "upload" && (
              <div style={{ marginTop: "10px" }}>
                <div style={{ height: "6px", background: "#F0F0F0", borderRadius: "3px", overflow: "hidden" }}><div style={{ width: progress + "%", height: "100%", background: "#0A0A0A" }} /></div>
                <div style={{ fontSize: "12px", color: "#737373", marginTop: "4px" }}>Subiendo… {progress}%</div>
              </div>
            )}
            {isVideo && <p style={{ fontSize: "12px", color: "#737373", marginTop: "8px" }}>Los videos se recortan a 9:16 y a 60 segundos (lo máximo de una historia).</p>}

            <span style={label}>2 · Cómo sale</span>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button style={chip(mode === "raw")} onClick={() => setMode("raw")}>Tal cual</button>
              <button style={chip(mode === "brand")} onClick={() => setMode("brand")}>Con mi logo</button>
              <button style={chip(mode === "product")} onClick={() => setMode("product")}>Con producto</button>
            </div>
            {mode === "brand" && (
              <input value={text} onChange={(e) => setText(e.target.value)} maxLength={70} placeholder="Texto opcional (ej: Llegó mercadería 🔥)"
                style={{ width: "100%", boxSizing: "border-box", marginTop: "10px", padding: "11px 12px", border: "1px solid #E5E5E5", borderRadius: "10px", fontSize: "16px" }} />
            )}
            {mode === "product" && (
              <div style={{ marginTop: "10px" }}>
                {product ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px", border: "1px solid #0A0A0A", borderRadius: "10px" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {product.image && <img src={product.image} alt="" style={{ width: "40px", height: "40px", objectFit: "contain" }} />}
                    <span style={{ fontSize: "13px", flex: 1 }}>{product.name}<br /><span style={{ color: "#737373", fontSize: "11px" }}>{product.sizes.length ? product.sizes.join(" ") : "sin stock"}</span></span>
                    <button style={{ ...ghost, padding: "6px 10px", fontSize: "12px" }} onClick={() => setProduct(null)}>Cambiar</button>
                  </div>
                ) : (
                  <>
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar modelo o marca"
                      style={{ width: "100%", boxSizing: "border-box", padding: "11px 12px", border: "1px solid #E5E5E5", borderRadius: "10px", fontSize: "16px" }} />
                    <div style={{ maxHeight: "200px", overflowY: "auto", marginTop: "6px" }}>
                      {products.map((p) => (
                        <button key={p.id} onClick={() => setProduct(p)} style={{ display: "flex", width: "100%", alignItems: "center", gap: "10px", padding: "6px", border: "none", background: "white", cursor: "pointer", textAlign: "left" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {p.image && <img src={p.image} alt="" style={{ width: "36px", height: "36px", objectFit: "contain" }} />}
                          <span style={{ fontSize: "13px" }}>{p.name} <span style={{ color: "#737373", fontSize: "11px" }}>· {p.brand}</span></span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
                <select value={tag} onChange={(e) => setTag(e.target.value)} style={{ width: "100%", marginTop: "8px", padding: "10px", border: "1px solid #E5E5E5", borderRadius: "10px", fontSize: "16px", background: "white" }}>
                  {TAGS.map((t) => <option key={t} value={t}>{t || "Sin etiqueta"}</option>)}
                </select>
              </div>
            )}

            <span style={label}>3 · Hora</span>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              {["10:00", "13:00", "18:00", "20:00", "22:00"].map((t) => <button key={t} style={chip(time === t)} onClick={() => setTime(t)}>{t}</button>)}
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ padding: "8px 10px", border: "1px solid #E5E5E5", borderRadius: "10px", fontSize: "16px" }} />
            </div>
            {past && <p style={{ fontSize: "12px", color: "#B91C1C", marginTop: "6px" }}>Esa hora ya pasó: elegí una más tarde.</p>}

            <button style={{ ...btn, width: "100%", marginTop: "20px", opacity: canBuild ? 1 : 0.5 }} disabled={!canBuild} onClick={build}>
              {busy === "build" ? "Armando…" : "Ver cómo queda"}
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            {preview ? (
              <StoryPreview handle={account.handle} picture={account.picture} images={[preview]} />
            ) : localUrl ? (
              <div style={{ width: "300px", aspectRatio: "9/16", borderRadius: "14px", overflow: "hidden", background: "#000", opacity: 0.6, maxWidth: "100%" }}>
                {isVideo
                  ? <video src={localUrl} muted playsInline autoPlay loop style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  // eslint-disable-next-line @next/next/no-img-element
                  : <img src={localUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
              </div>
            ) : (
              <div style={{ width: "300px", maxWidth: "100%", aspectRatio: "9/16", borderRadius: "14px", background: "#F5F5F5", display: "grid", placeItems: "center", fontSize: "13px", color: "#A3A3A3" }}>Vista previa</div>
            )}
            {preview && isVideo && <p style={{ fontSize: "11px", color: "#A3A3A3", maxWidth: "300px", textAlign: "center" }}>Si el video tarda en aparecer, Cloudinary lo está procesando: esperá unos segundos.</p>}
            <button style={{ ...btn, width: "300px", maxWidth: "100%", opacity: preview && !past && !busy ? 1 : 0.5 }} disabled={!preview || past || !!busy} onClick={schedule}>
              {busy === "schedule" ? "Agendando…" : `Agendar ${time}`}
            </button>
            {error && <p style={{ color: "#B91C1C", fontSize: "13px", maxWidth: "300px" }}>{error}</p>}
            <p style={{ fontSize: "11px", color: "#A3A3A3" }}>Al agendar, sale sola a esa hora.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
