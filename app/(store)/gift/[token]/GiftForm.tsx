"use client";
import { useState } from "react";

export default function GiftForm({ token }: { token: string }) {
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/gift/claim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, ...f }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Algo salió mal"); setLoading(false); return; }
      setDone(data.email);
    } catch {
      setError("Error de conexión"); setLoading(false);
    }
  };

  if (done) {
    return (
      <div style={{ textAlign: "center", marginTop: 8 }}>
        <p style={{ fontSize: 17, fontWeight: 600, margin: "0 0 8px" }}>¡Listo! 🎁</p>
        <p style={{ fontSize: 15, color: "#525252", lineHeight: 1.5 }}>Te mandamos tu gift card a <b>{done}</b>. Si no la ves, revisá la carpeta de spam.</p>
        <a href="/catalog" className="cart-cta" style={{ marginTop: 20 }}>Ir a la tienda</a>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }} className="co-fila">
        <div><label className="co-label">Nombre</label><input className="co-campo" value={f.firstName} onChange={set("firstName")} autoComplete="given-name" required /></div>
        <div><label className="co-label">Apellido</label><input className="co-campo" value={f.lastName} onChange={set("lastName")} autoComplete="family-name" required /></div>
      </div>
      <div className="co-fila"><label className="co-label">Email</label><input className="co-campo" type="email" value={f.email} onChange={set("email")} autoComplete="email" required /></div>
      <div className="co-fila"><label className="co-label">Teléfono (opcional)</label><input className="co-campo" type="tel" value={f.phone} onChange={set("phone")} autoComplete="tel" placeholder="11 2345 6789" /></div>
      {error && <p style={{ color: "#DC2626", fontSize: 14, margin: "4px 0 12px" }}>{error}</p>}
      <button className="cart-cta" type="submit" disabled={loading} style={{ marginTop: 8, opacity: loading ? 0.6 : 1 }}>
        {loading ? "Enviando..." : "Quiero mi gift card"}
      </button>
      <p style={{ fontSize: 12, color: "#A3A3A3", textAlign: "center", marginTop: 12 }}>Tus datos quedan guardados en Member Club para mandarte la gift card y novedades.</p>
    </form>
  );
}
