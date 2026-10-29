"use client";
import { useState } from "react";

// Botonera unica para un borrador ya previsualizado: AGENDAR (horarios
// sugeridos o fecha a mano) o PUBLICAR AHORA (con confirmacion). La usan
// "Armar post", "Anuncios" y cualquier pantalla que cree un borrador.
const btn: React.CSSProperties = { background: "#0A0A0A", color: "white", border: "none", borderRadius: "8px", padding: "10px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer" };
const ghost: React.CSSProperties = { ...btn, background: "white", color: "#0A0A0A", border: "1px solid #E5E5E5" };

function toLocalInput(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function quickTimes() {
  const now = new Date();
  const at = (days: number, h: number) => { const d = new Date(now); d.setDate(d.getDate() + days); d.setHours(h, 0, 0, 0); return d; };
  return ([["Hoy 13:00", at(0, 13)], ["Hoy 20:00", at(0, 20)], ["Mañana 10:00", at(1, 10)], ["Mañana 13:00", at(1, 13)], ["Mañana 20:00", at(1, 20)]] as const)
    .filter(([, d]) => +d > Date.now() + 15 * 60_000)
    .slice(0, 4)
    .map(([label, d]) => ({ label, value: toLocalInput(d) }));
}
const fmtWhen = (v: string) => new Date(v).toLocaleString("es-AR", { weekday: "long", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function PublishActions({ postId, isStory, handle, beforeAction, onPublished }: {
  postId: string;
  isStory: boolean;
  handle: string;
  beforeAction?: () => Promise<void>; // ej. guardar el texto editado
  onPublished?: (permalink: string) => void;
}) {
  // Viene de "+ Subir algo" en la agenda (?fecha=...): ese dia ya elegido.
  const [when, setWhen] = useState(() => {
    try {
      const f = new URLSearchParams(window.location.search).get("fecha");
      return f && +new Date(f) > Date.now() ? f : "";
    } catch { return ""; }
  });
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [confirmNow, setConfirmNow] = useState(false);
  const [scheduled, setScheduled] = useState("");
  const [published, setPublished] = useState("");

  async function call(path: string, body: object) {
    const r = await fetch(`/api/admin/social/posts/${postId}/${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "Error");
    return d;
  }

  async function run(kind: "schedule" | "now") {
    setBusy(kind);
    setError("");
    try {
      if (beforeAction) await beforeAction();
      if (kind === "schedule") {
        await call("schedule", { confirm: true, scheduledAt: new Date(when).toISOString() });
        setScheduled(when);
      } else {
        const d = await call("publish", { confirm: true });
        setPublished(d.post?.permalink || "ok");
        onPublished?.(d.post?.permalink || "ok");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy("");
      setConfirmNow(false);
    }
  }

  if (published)
    return (
      <p style={{ color: "#16A34A", fontWeight: 600, fontSize: "13px" }}>
        ✓ Publicado en @{handle}. {published.startsWith("http") && <a href={published} target="_blank" rel="noreferrer">Ver en Instagram →</a>}
      </p>
    );
  if (scheduled)
    return (
      <p style={{ color: "#16A34A", fontWeight: 600, fontSize: "13px" }}>
        ✓ Agendad{isStory ? "a" : "o"} para el {fmtWhen(scheduled)}. Lo ves en la <a href="/admin/social">Agenda</a>.
      </p>
    );

  return (
    <div style={{ fontSize: "13px" }}>
      <p style={{ fontWeight: 600, marginBottom: "8px" }}>¿Cuándo sale?</p>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
        {quickTimes().map((q) => (
          <button key={q.label} style={{ ...ghost, padding: "6px 10px", fontSize: "12px", background: when === q.value ? "#F4F4F4" : "white" }} onClick={() => setWhen(q.value)}>{q.label}</button>
        ))}
      </div>
      <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)}
        style={{ width: "100%", border: "1px solid #E5E5E5", borderRadius: "8px", padding: "10px 12px", fontSize: "14px", fontFamily: "inherit", marginBottom: "10px" }} />
      {!confirmNow ? (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button style={{ ...btn, opacity: when ? 1 : 0.4 }} disabled={!when || !!busy} onClick={() => run("schedule")}>
            {busy === "schedule" ? "Agendando…" : when ? `Agendar para ${fmtWhen(when)}` : "Agendar"}
          </button>
          <button style={ghost} disabled={!!busy} onClick={() => setConfirmNow(true)}>Publicar ahora</button>
        </div>
      ) : (
        <>
          <p style={{ margin: "4px 0 10px", color: "#B45309" }}>
            Se va a publicar <b>ahora</b>{isStory ? " como historia" : ""} en <b>@{handle}</b>. Antes se revisa que haya stock.
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button style={{ ...btn, background: "#16A34A" }} disabled={!!busy} onClick={() => run("now")}>{busy === "now" ? "Publicando…" : "Confirmar y publicar"}</button>
            <button style={ghost} disabled={!!busy} onClick={() => setConfirmNow(false)}>Cancelar</button>
          </div>
        </>
      )}
      {error && <p style={{ color: "#B91C1C", marginTop: "8px" }}>{error}</p>}
      <p style={{ fontSize: "12px", color: "#737373", marginTop: "8px" }}>Mientras tanto queda en Borradores.</p>
    </div>
  );
}
