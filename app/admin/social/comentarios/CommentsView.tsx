"use client";
import { useCallback, useEffect, useState } from "react";

type Rule = {
  id?: string; active: boolean; name: string; keyword: string; allMedia: boolean; mediaIds: string[];
  publicReply: string | null; privateMessage: string; link: string | null;
  giftPercent: number | null; giftMinAmount: number | null; giftDays: number | null;
};
type Stat = { ruleId: string; sent: number; failed: number; claimed: number; used: number };
type Reply = { id: string; ruleId: string; igUsername: string | null; commentText: string | null; status: string; error: string | null; claimedAt: string | null; email: string | null; couponCode: string | null; createdAt: string };
type Media = { id: string; caption: string; thumb: string; permalink: string; type: string; timestamp: string };

const btn: React.CSSProperties = { background: "#0A0A0A", color: "white", border: "none", borderRadius: "8px", padding: "9px 14px", fontSize: "13px", fontWeight: 600, cursor: "pointer" };
const btnGhost: React.CSSProperties = { ...btn, background: "white", color: "#0A0A0A", border: "1px solid #E5E5E5" };
const card: React.CSSProperties = { background: "white", border: "1px solid #EDEDED", borderRadius: "14px", padding: "18px", marginBottom: "16px" };
const input: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1px solid #E5E5E5", borderRadius: "8px", fontSize: "14px", boxSizing: "border-box" };
const lbl: React.CSSProperties = { display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#737373", margin: "14px 0 6px" };

const GIFT_DEFAULT: Rule = {
  active: true, name: "Gift card 30% (reel web)", keyword: "GIFT", allMedia: false, mediaIds: [],
  publicReply: "¡Te la mandamos por privado, {usuario}! 🎁",
  privateMessage: "¡Hola! 🎁 Acá está tu gift card de {porcentaje} OFF para tu primera compra en la web (pagando por transferencia, compras desde {minimo}).\n\nCompletá tus datos en este link y te llega el código por mail 👇\n{link}",
  link: null, giftPercent: 30, giftMinAmount: 100000, giftDays: 30,
};

export default function CommentsView() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [recent, setRecent] = useState<Reply[]>([]);
  const [edit, setEdit] = useState<Rule | null>(null);
  const [media, setMedia] = useState<Media[] | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [conn, setConn] = useState("");

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/social/comments");
    const d = await r.json();
    if (!r.ok) { setError(d.error || "Error"); return; }
    setRules(d.rules); setStats(d.stats); setRecent(d.recent);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function openEdit(r: Rule) {
    setEdit({ ...r }); setError("");
    if (!media) {
      const res = await fetch("/api/admin/social/comments?media=1");
      const d = await res.json();
      if (res.ok) setMedia(d.media); else setError(d.error || "No se pudieron traer las publicaciones");
    }
  }

  async function save(r: Rule) {
    setBusy("save"); setError("");
    try {
      const res = await fetch("/api/admin/social/comments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ rule: r }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Error");
      setEdit(null); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setBusy(""); }
  }

  async function checkConn() {
    setConn("Revisando…");
    const res = await fetch("/api/admin/social/comments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "subscribe" }) });
    const d = await res.json();
    setConn(res.ok && d.ok ? "✓ Instagram avisa los comentarios" : "✗ " + (d.error || "No se pudo activar. Revisá que la app de Meta tenga el permiso de comentarios."));
  }

  const statOf = (id?: string) => stats.find((s) => s.ruleId === id);
  const ruleName = (id: string) => rules.find((r) => r.id === id)?.name || "";

  return (
    <div style={{ padding: "32px", maxWidth: "900px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0 }}>Comentarios</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={btnGhost} onClick={() => openEdit({ ...GIFT_DEFAULT, keyword: "", name: "", publicReply: "", privateMessage: "", giftPercent: null, giftMinAmount: null, giftDays: null })}>+ Respuesta simple</button>
          <button style={btn} onClick={() => openEdit({ ...GIFT_DEFAULT })}>+ Gift card</button>
        </div>
      </div>
      <p style={{ fontSize: "13px", color: "#737373", margin: "8px 0 20px" }}>
        Elegís una o varias publicaciones y una palabra (ej.: <b>GIFT</b>). Cuando alguien la comenta, el bot le contesta el comentario y le manda un privado. Con gift card, el privado lleva un link para que cargue sus datos (queda como cliente) y le llega el código por mail. A cada persona, una sola vez.
      </p>
      {error && <p style={{ color: "#DC2626", fontSize: 13 }}>{error}</p>}

      {edit && (
        <div style={card}>
          <h2 style={{ fontSize: 16, margin: 0 }}>{edit.id ? "Editar respuesta" : "Nueva respuesta"}</h2>
          <label style={lbl}>Nombre (solo para vos)</label>
          <input style={input} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="Ej.: Gift card reel web" />
          <label style={lbl}>Palabra que tienen que comentar</label>
          <input style={{ ...input, textTransform: "uppercase" }} value={edit.keyword} onChange={(e) => setEdit({ ...edit, keyword: e.target.value })} placeholder="GIFT (vacío = cualquier comentario)" />

          <label style={lbl}>Publicaciones</label>
          <label style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
            <input type="checkbox" checked={edit.allMedia} onChange={(e) => setEdit({ ...edit, allMedia: e.target.checked })} /> Todas las publicaciones
          </label>
          {!edit.allMedia && (
            media === null ? <p style={{ fontSize: 13, color: "#737373" }}>Cargando publicaciones…</p> :
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 8 }}>
              {media.map((m) => {
                const on = edit.mediaIds.includes(m.id);
                return (
                  <button key={m.id} type="button" title={m.caption}
                    onClick={() => setEdit({ ...edit, mediaIds: on ? edit.mediaIds.filter((x) => x !== m.id) : [...edit.mediaIds, m.id] })}
                    style={{ position: "relative", padding: 0, border: on ? "3px solid #0A0A0A" : "1px solid #E5E5E5", borderRadius: 10, overflow: "hidden", aspectRatio: "4/5", background: "#F4F4F4", cursor: "pointer" }}>
                    {m.thumb && <img src={m.thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
                    {m.type === "VIDEO" && <span style={{ position: "absolute", top: 4, right: 4, fontSize: 10, background: "rgba(0,0,0,.6)", color: "white", borderRadius: 4, padding: "1px 4px" }}>REEL</span>}
                    {on && <span style={{ position: "absolute", bottom: 4, left: 4, fontSize: 11, background: "#0A0A0A", color: "white", borderRadius: 4, padding: "1px 5px" }}>✓</span>}
                  </button>
                );
              })}
            </div>
          )}

          <label style={lbl}>Respuesta en el comentario (pública)</label>
          <input style={input} value={edit.publicReply || ""} onChange={(e) => setEdit({ ...edit, publicReply: e.target.value })} />
          <small style={{ color: "#737373", fontSize: 12 }}>{"{usuario}"} = @ de quien comentó. Vacío = no responde en público.</small>

          <label style={lbl}>Mensaje privado</label>
          <textarea style={{ ...input, minHeight: 120, fontFamily: "inherit" }} value={edit.privateMessage} onChange={(e) => setEdit({ ...edit, privateMessage: e.target.value })} />
          <small style={{ color: "#737373", fontSize: 12 }}>{"{link}"} = link {edit.giftPercent ? "para pedir la gift card" : "que pongas abajo"} · {"{porcentaje}"} · {"{minimo}"}</small>

          {edit.giftPercent !== null ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              <div><label style={lbl}>Descuento %</label><input style={input} type="number" value={edit.giftPercent ?? ""} onChange={(e) => setEdit({ ...edit, giftPercent: Number(e.target.value) || 0 })} /></div>
              <div><label style={lbl}>Compra mínima $</label><input style={input} type="number" value={edit.giftMinAmount ?? ""} onChange={(e) => setEdit({ ...edit, giftMinAmount: Number(e.target.value) || null })} /></div>
              <div><label style={lbl}>Vence (días)</label><input style={input} type="number" value={edit.giftDays ?? ""} onChange={(e) => setEdit({ ...edit, giftDays: Number(e.target.value) || null })} /></div>
              <p style={{ gridColumn: "1 / -1", fontSize: 12, color: "#737373", margin: 0 }}>El código es único por persona, de un solo uso, solo pagando por transferencia (reemplaza el descuento por transferencia), solo para la primera compra y con el mismo email.</p>
            </div>
          ) : (
            <><label style={lbl}>Link</label><input style={input} value={edit.link || ""} onChange={(e) => setEdit({ ...edit, link: e.target.value })} placeholder="https://www.memberclubargentina.com/catalog" /></>
          )}

          <label style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center", marginTop: 14 }}>
            <input type="checkbox" checked={edit.active} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} /> Activa
          </label>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button style={btn} disabled={busy === "save"} onClick={() => save(edit)}>{busy === "save" ? "Guardando…" : "Guardar"}</button>
            <button style={btnGhost} onClick={() => setEdit(null)}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={card}>
        {rules.length === 0 ? <p style={{ fontSize: 13, color: "#737373", margin: 0 }}>Todavía no hay respuestas automáticas.</p> :
          rules.map((r) => {
            const s = statOf(r.id);
            return (
              <div key={r.id} onClick={() => openEdit(r)} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 0", borderBottom: "1px solid #F2F2F2", cursor: "pointer" }}>
                <div>
                  <b style={{ fontSize: 14 }}>{r.name}</b>{!r.active && <small style={{ color: "#A3A3A3" }}> · pausada</small>}
                  <div style={{ fontSize: 12, color: "#737373", marginTop: 2 }}>
                    {r.keyword ? <>Comentá <b>{r.keyword}</b></> : "Cualquier comentario"} · {r.allMedia ? "todas las publicaciones" : r.mediaIds.length + (r.mediaIds.length === 1 ? " publicación" : " publicaciones")}
                    {r.giftPercent ? " · gift card " + r.giftPercent + "%" : ""}
                  </div>
                </div>
                <div style={{ textAlign: "right", fontSize: 12, color: "#525252", whiteSpace: "nowrap" }}>
                  <div><b>{s?.sent || 0}</b> respondidos{s?.failed ? <span style={{ color: "#DC2626" }}> · {s.failed} con error</span> : null}</div>
                  {r.giftPercent ? <div><b>{s?.claimed || 0}</b> pidieron la gift · <b>{s?.used || 0}</b> compraron</div> : null}
                </div>
              </div>
            );
          })}
      </div>

      <div style={card}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#737373" }}>Conexión con Instagram</div>
        <p style={{ fontSize: 13, color: "#525252", margin: "6px 0 10px" }}>Para que lleguen los comentarios, la app de Meta tiene que tener el permiso de comentarios y el aviso de &quot;comments&quot; activado. Este botón revisa y activa la suscripción.</p>
        <button style={btnGhost} onClick={checkConn}>Revisar conexión</button> <span style={{ fontSize: 13, marginLeft: 8 }}>{conn}</span>
      </div>

      {recent.length > 0 && (
        <div style={card}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#737373", marginBottom: 8 }}>Últimos comentarios respondidos</div>
          {recent.map((x) => (
            <div key={x.id} style={{ fontSize: 13, padding: "8px 0", borderBottom: "1px solid #F6F6F6" }}>
              <b>@{x.igUsername || "?"}</b> <span style={{ color: "#737373" }}>“{(x.commentText || "").slice(0, 80)}”</span>
              <div style={{ fontSize: 12, color: x.status === "failed" ? "#DC2626" : "#737373" }}>
                {new Date(x.createdAt).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} · {ruleName(x.ruleId)} ·{" "}
                {x.status === "failed" ? "no se pudo responder: " + (x.error || "") : x.claimedAt ? "pidió la gift (" + x.email + ", " + x.couponCode + ")" : x.status === "pending" ? "enviando…" : "respondido"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
