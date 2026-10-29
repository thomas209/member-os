"use client";
import { useEffect, useState } from "react";

type Product = { id: string; name: string; brand: string; image: string | null; sizes: string[] };
type Spec = Record<string, unknown> & { descripcion?: string; showPrice?: boolean; showSizes?: boolean };

const btn: React.CSSProperties = { background: "#0A0A0A", color: "white", border: "none", borderRadius: "10px", padding: "10px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer" };
const ghost: React.CSSProperties = { ...btn, background: "white", color: "#0A0A0A", border: "1px solid #E5E5E5" };
const card: React.CSSProperties = { background: "white", border: "1px solid #EDEDED", borderRadius: "14px", padding: "18px" };
const label: React.CSSProperties = { fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#737373", marginBottom: "8px", display: "block" };
const TAGS = ["", "NEW IN", "RESTOCK", "ULTIMOS TALLES", "SALE"];

// Achica la imagen en el navegador antes de mandarla (mas rapido y mas barato).
function shrink(file: File): Promise<{ dataUrl: string; ratio: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1080 / img.width);
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      resolve({ dataUrl: c.toDataURL("image/jpeg", 0.85), ratio: img.height / img.width });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => reject(new Error("No pude leer la imagen"));
    img.src = URL.createObjectURL(file);
  });
}

export default function ReferenceStudio() {
  const [ref, setRef] = useState<string>("");
  const [format, setFormat] = useState<"post" | "story">("post");
  const [spec, setSpec] = useState<Spec | null>(null);
  const [q, setQ] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [tag, setTag] = useState("");
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState<"" | "analyze" | "preview" | "draft">("");
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      fetch("/api/admin/social/products?q=" + encodeURIComponent(q)).then((r) => r.json()).then((j) => setProducts(j.products || [])).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  async function call(body: object) {
    const r = await fetch("/api/admin/social/reference", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "Error");
    return j;
  }

  async function onFile(f: File | undefined) {
    if (!f) return;
    setError(""); setSpec(null); setPreview("");
    try {
      const { dataUrl, ratio } = await shrink(f);
      setRef(dataUrl);
      setFormat(ratio > 1.5 ? "story" : "post");
    } catch (e) { setError(e instanceof Error ? e.message : "Error"); }
  }

  async function analyze() {
    setBusy("analyze"); setError("");
    try {
      const j = await call({ action: "analyze", image: ref });
      setSpec(j.spec);
    } catch (e) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setBusy(""); }
  }

  // Vista previa: gratis, se rehace cada vez que cambia algo.
  useEffect(() => {
    if (!spec || !product) return;
    let cancel = false;
    setBusy("preview"); setError("");
    call({ action: "preview", spec, productId: product.id, tag: tag || null, format })
      .then((j) => { if (!cancel) setPreview(j.image); })
      .catch((e) => { if (!cancel) setError(e.message); })
      .finally(() => { if (!cancel) setBusy(""); });
    return () => { cancel = true; };
  }, [spec, product, tag, format]);

  async function draft() {
    if (!spec || !product) return;
    setBusy("draft"); setError("");
    try {
      const j = await call({ action: "draft", spec, productId: product.id, tag: tag || null, format });
      const fecha = new URLSearchParams(window.location.search).get("fecha");
      window.location.href = "/admin/social?open=" + j.post.id + (fecha ? "&fecha=" + encodeURIComponent(fecha) : "");
    } catch (e) { setError(e instanceof Error ? e.message : "Error"); setBusy(""); }
  }

  const aspect = format === "story" ? "9 / 16" : "4 / 5";
  const toggle = (k: "showPrice" | "showSizes") => spec && setSpec({ ...spec, [k]: !spec[k] });

  return (
    <div style={{ padding: "48px", maxWidth: "1100px" }}>
      <h1 style={{ fontSize: "26px", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "4px" }}>Hacelo como este</h1>
      <p style={{ fontSize: "14px", color: "#737373" }}>Subí un post que te guste y lo armo con ese estilo, usando tus fotos, tu logo y tus datos reales.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px", marginTop: "24px", alignItems: "start" }}>
        {/* 1. Referencia */}
        <div style={card}>
          <span style={label}>1 · Referencia</span>
          <label style={{ display: "flex", alignItems: "center", justifyContent: "center", aspectRatio: aspect, border: "1px dashed #D4D4D4", borderRadius: "12px", cursor: "pointer", overflow: "hidden", background: "#FAFAFA" }}
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files[0]); }}>
            {ref
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={ref} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              : <span style={{ fontSize: "13px", color: "#737373", padding: "16px", textAlign: "center" }}>Arrastrá la captura acá<br />o tocá para elegirla</span>}
            <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display: "none" }} onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
            <button style={ghost} onClick={() => setFormat(format === "post" ? "story" : "post")}>{format === "post" ? "Post 4:5" : "Historia 9:16"}</button>
            <button style={{ ...btn, opacity: !ref || busy === "analyze" ? 0.5 : 1 }} disabled={!ref || busy === "analyze"} onClick={analyze}>
              {busy === "analyze" ? "Leyendo el diseño…" : spec ? "Volver a analizar" : "Analizar estilo"}
            </button>
          </div>
          {spec?.descripcion && <p style={{ fontSize: "12px", color: "#525252", marginTop: "12px" }}>Estilo: {String(spec.descripcion)}</p>}
        </div>

        {/* 2. Producto */}
        <div style={card}>
          <span style={label}>2 · Producto</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar modelo o marca" style={{ width: "100%", padding: "10px 12px", border: "1px solid #E5E5E5", borderRadius: "10px", fontSize: "13px", marginBottom: "10px" }} />
          <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
            {products.filter((p) => p.image).map((p) => (
              <button key={p.id} onClick={() => setProduct(p)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px", border: "1px solid " + (product?.id === p.id ? "#0A0A0A" : "transparent"), borderRadius: "10px", background: product?.id === p.id ? "#F5F5F5" : "white", cursor: "pointer", textAlign: "left" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image!} alt="" style={{ width: "40px", height: "40px", objectFit: "contain", background: "white" }} />
                <span style={{ fontSize: "13px" }}>{p.name}<br /><span style={{ color: "#737373", fontSize: "11px" }}>{p.brand}{p.sizes.length ? " · " + p.sizes.join(" ") : " · sin stock"}</span></span>
              </button>
            ))}
          </div>
          <span style={{ ...label, marginTop: "14px" }}>Etiqueta</span>
          <select value={tag} onChange={(e) => setTag(e.target.value)} style={{ width: "100%", padding: "9px", border: "1px solid #E5E5E5", borderRadius: "10px", fontSize: "13px" }}>
            {TAGS.map((t) => <option key={t} value={t}>{t || "Sin etiqueta"}</option>)}
          </select>
          {spec && (
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <button style={ghost} onClick={() => toggle("showPrice")}>{spec.showPrice ? "Sacar precio" : "Mostrar precio"}</button>
              <button style={ghost} onClick={() => toggle("showSizes")}>{spec.showSizes ? "Sacar talles" : "Mostrar talles"}</button>
            </div>
          )}
        </div>

        {/* 3. Resultado */}
        <div style={card}>
          <span style={label}>3 · Tu versión</span>
          <div style={{ aspectRatio: aspect, borderRadius: "12px", overflow: "hidden", background: "#F5F5F5", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {preview
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", opacity: busy === "preview" ? 0.5 : 1 }} />
              : <span style={{ fontSize: "13px", color: "#A3A3A3", padding: "16px", textAlign: "center" }}>{busy === "preview" ? "Armando…" : !spec ? "Primero analizá la referencia" : "Elegí un producto"}</span>}
          </div>
          <button style={{ ...btn, width: "100%", marginTop: "12px", opacity: !preview || !!busy ? 0.5 : 1 }} disabled={!preview || !!busy} onClick={draft}>
            {busy === "draft" ? "Guardando…" : "Crear borrador"}
          </button>
          <p style={{ fontSize: "11px", color: "#A3A3A3", marginTop: "8px" }}>La vista previa no gasta IA. Nada se publica sin tu OK.</p>
        </div>
      </div>
      {error && <p style={{ color: "#B91C1C", fontSize: "13px", marginTop: "16px" }}>{error}</p>}
    </div>
  );
}
