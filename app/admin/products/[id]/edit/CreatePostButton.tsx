"use client";
import { useState } from "react";

// Atajo desde la ficha del producto: arma un borrador para Instagram con las
// fotos reales y texto de IA, y lleva al community manager para revisarlo.
// No publica nada: el borrador queda esperando tu OK.
const TAGS = ["", "NEW IN", "RESTOCK", "ULTIMOS TALLES", "SALE"] as const;
const TAG_LABEL: Record<string, string> = { "": "Sin etiqueta", "NEW IN": "New in", RESTOCK: "Restock", "ULTIMOS TALLES": "Últimos talles", SALE: "Sale" };

export default function CreatePostButton({ productId, defaultTag }: { productId: string; defaultTag?: string }) {
  const [format, setFormat] = useState<"post" | "story">("post");
  const [tag, setTag] = useState<string>(defaultTag || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function create() {
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/admin/social/drafts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: [productId], tag: tag || null, format }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudo armar el borrador");
      window.location.href = "/admin/social?open=" + j.post.id;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setLoading(false);
    }
  }

  const pill = (active: boolean): React.CSSProperties => ({
    padding: "7px 12px", fontSize: "12px", fontWeight: 600, borderRadius: "999px", cursor: "pointer",
    border: "1px solid " + (active ? "#0A0A0A" : "#E5E5E5"), background: active ? "#0A0A0A" : "white", color: active ? "white" : "#0A0A0A",
  });

  return (
    <div style={{ marginTop: "16px", padding: "14px 16px", border: "1px solid #EDEDED", borderRadius: "14px", background: "white", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px" }}>
      <span style={{ fontSize: "13px", fontWeight: 700, marginRight: "4px" }}>Instagram</span>
      <button type="button" style={pill(format === "post")} onClick={() => setFormat("post")}>Post</button>
      <button type="button" style={pill(format === "story")} onClick={() => setFormat("story")}>Historia</button>
      <select value={tag} onChange={(e) => setTag(e.target.value)} style={{ padding: "7px 10px", fontSize: "12px", border: "1px solid #E5E5E5", borderRadius: "10px", background: "white" }}>
        {TAGS.map((t) => <option key={t} value={t}>{TAG_LABEL[t]}</option>)}
      </select>
      <button type="button" onClick={create} disabled={loading}
        style={{ marginLeft: "auto", background: "#0A0A0A", color: "white", border: "none", borderRadius: "10px", padding: "9px 14px", fontSize: "13px", fontWeight: 600, cursor: loading ? "wait" : "pointer", opacity: loading ? 0.6 : 1 }}>
        {loading ? "Armando…" : "Crear borrador"}
      </button>
      {error && <div style={{ width: "100%", fontSize: "12px", color: "#B91C1C" }}>{error}</div>}
      <div style={{ width: "100%", fontSize: "11px", color: "#A3A3A3" }}>Usa las fotos reales del producto. Nada se publica sin tu OK.</div>
    </div>
  );
}
