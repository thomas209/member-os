"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type ConvItem = { id: string; platform: string; name: string; lastMessageAt: string | null; unread: boolean; canReply: boolean; preview: string; lastFromCustomer: boolean };
type Msg = { id: string; direction: "in" | "out"; text: string | null; attachments: unknown; sentBy: string; sentAt: string };
type Conv = { id: string; platform: string; name: string; canReply: boolean; windowEndsAt: string | null; messages: Msg[] };
type Suggestion = { generationId: string; reply: string; needsHuman: boolean; reason: string; category: string; sources: { productos: string[]; pedidoVerificado: boolean } };

const btn: React.CSSProperties = { background: "#0A0A0A", color: "white", border: "none", borderRadius: "8px", padding: "9px 14px", fontSize: "13px", fontWeight: 600, cursor: "pointer" };
const btnGhost: React.CSSProperties = { ...btn, background: "white", color: "#0A0A0A", border: "1px solid #E5E5E5" };

function when(d: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  const today = new Date().toDateString() === dt.toDateString();
  return today ? dt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) : dt.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

export default function InboxView() {
  const [list, setList] = useState<ConvItem[]>([]);
  const [conv, setConv] = useState<Conv | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState("");
  const [draft, setDraft] = useState("");
  const [sugg, setSugg] = useState<Suggestion | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const bottom = useRef<HTMLDivElement>(null);

  const loadList = useCallback(async () => {
    const r = await fetch("/api/admin/social/inbox");
    if (r.ok) setList((await r.json()).conversations);
  }, []);

  const open = useCallback(async (id: string) => {
    setError("");
    setSugg(null);
    setDraft("");
    const r = await fetch("/api/admin/social/inbox/" + id);
    const d = await r.json();
    if (!r.ok) return setError(d.error || "Error");
    setConv(d.conversation);
    setList((l) => l.map((c) => (c.id === id ? { ...c, unread: false } : c)));
    setTimeout(() => bottom.current?.scrollIntoView(), 50);
  }, []);

  const sync = useCallback(async () => {
    setSyncing(true);
    setMsg("");
    try {
      const r = await fetch("/api/admin/social/inbox/sync", { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Error");
      setMsg(d.nuevos ? `${d.nuevos} mensaje${d.nuevos > 1 ? "s" : ""} nuevo${d.nuevos > 1 ? "s" : ""}` : "Al día");
      await loadList();
      if (conv) await open(conv.id);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setSyncing(false);
    }
  }, [conv, loadList, open]);

  useEffect(() => {
    loadList().then(() => fetch("/api/admin/social/inbox/sync", { method: "POST" }).then(loadList));
    const t = setInterval(() => fetch("/api/admin/social/inbox/sync", { method: "POST" }).then(loadList), 60_000);
    return () => clearInterval(t);
  }, [loadList]);

  async function suggest() {
    if (!conv) return;
    setBusy("suggest");
    setError("");
    try {
      const r = await fetch(`/api/admin/social/inbox/${conv.id}/suggest`, { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Error");
      setSugg(d);
      setDraft(d.reply);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy("");
    }
  }

  async function send() {
    if (!conv || !draft.trim()) return;
    setBusy("send");
    setError("");
    try {
      const r = await fetch(`/api/admin/social/inbox/${conv.id}/send`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: draft, generationId: sugg?.generationId, edited: sugg ? draft.trim() !== sugg.reply.trim() : false }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Error");
      setDraft("");
      setSugg(null);
      await open(conv.id);
      await loadList();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy("");
    }
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: "white" }}>
      {/* Lista */}
      <div style={{ width: "320px", borderRight: "1px solid #E5E5E5", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 16px", borderBottom: "1px solid #E5E5E5" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ fontSize: "18px", fontWeight: 700 }}>Inbox</h1>
            <button style={{ ...btnGhost, padding: "6px 10px" }} disabled={syncing} onClick={sync}>{syncing ? "…" : "Actualizar"}</button>
          </div>
          <p style={{ fontSize: "12px", color: "#737373", marginTop: "4px" }}>Instagram · {msg || "se actualiza cada minuto"}</p>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {list.length === 0 && <p style={{ padding: "16px", fontSize: "13px", color: "#737373" }}>Sin conversaciones todavía.</p>}
          {list.map((c) => (
            <button key={c.id} onClick={() => open(c.id)}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "12px 16px", border: "none", borderBottom: "1px solid #F5F5F5", background: conv?.id === c.id ? "#F5F5F5" : "white", cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ fontWeight: c.unread ? 700 : 500 }}>@{c.name}</span>
                <span style={{ color: "#A3A3A3", fontSize: "11px" }}>{when(c.lastMessageAt)}</span>
              </div>
              <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "4px" }}>
                {c.unread && <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#0095F6", flexShrink: 0 }} />}
                <span style={{ fontSize: "12px", color: "#737373", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.lastFromCustomer ? "" : "Vos: "}{c.preview}</span>
              </div>
              {c.lastFromCustomer && !c.canReply && <div style={{ fontSize: "11px", color: "#B45309", marginTop: "4px" }}>Más de 24 hs: responder desde la app</div>}
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {!conv ? (
          <div style={{ margin: "auto", color: "#A3A3A3", fontSize: "14px" }}>Elegí una conversación</div>
        ) : (
          <>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #E5E5E5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700 }}>@{conv.name}</div>
                <div style={{ fontSize: "12px", color: conv.canReply ? "#16A34A" : "#B45309" }}>
                  {conv.canReply && conv.windowEndsAt
                    ? `Podés responder hasta ${new Date(conv.windowEndsAt).toLocaleString("es-AR", { weekday: "short", hour: "2-digit", minute: "2-digit" })}`
                    : "Pasaron más de 24 hs: Instagram solo deja responder desde la app"}
                </div>
              </div>
              <a href={`https://ig.me/m/${conv.name}`} target="_blank" rel="noreferrer" style={{ fontSize: "12px" }}>Abrir en Instagram →</a>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", background: "#FAFAFA" }}>
              {conv.messages.map((m) => (
                <div key={m.id} style={{ display: "flex", justifyContent: m.direction === "out" ? "flex-end" : "flex-start", marginBottom: "8px" }}>
                  <div style={{ maxWidth: "70%", padding: "9px 13px", borderRadius: "18px", fontSize: "14px", lineHeight: 1.4, whiteSpace: "pre-wrap", background: m.direction === "out" ? "#3797F0" : "white", color: m.direction === "out" ? "white" : "#0A0A0A", border: m.direction === "out" ? "none" : "1px solid #EFEFEF" }}>
                    {m.text || "[foto/adjunto — verlo en Instagram]"}
                    <div style={{ fontSize: "10px", opacity: 0.6, marginTop: "4px", textAlign: "right" }}>
                      {new Date(m.sentAt).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      {m.sentBy === "tommy" ? " · desde Member OS" : m.sentBy === "bot" ? " · bot" : ""}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottom} />
            </div>

            <div style={{ borderTop: "1px solid #E5E5E5", padding: "14px 24px" }}>
              {sugg && (
                <div style={{ fontSize: "12px", marginBottom: "8px", padding: "8px 10px", borderRadius: "8px", background: sugg.needsHuman ? "#FEF3C7" : "#F0FDF4", color: sugg.needsHuman ? "#92400E" : "#166534" }}>
                  {sugg.needsHuman ? `⚠️ Conviene que lo revises vos: ${sugg.reason}` : "✓ Respuesta armada con datos de la tienda"}
                  {sugg.sources.productos.length > 0 && ` · productos: ${sugg.sources.productos.slice(0, 3).join(", ")}`}
                  {sugg.sources.pedidoVerificado && " · pedido verificado"}
                </div>
              )}
              {error && <p style={{ color: "#DC2626", fontSize: "13px", marginBottom: "8px" }}>{error}</p>}
              <textarea value={draft} onChange={(e) => setDraft(e.target.value)} disabled={!conv.canReply}
                placeholder={conv.canReply ? "Escribí la respuesta o tocá “Sugerir respuesta”" : "Fuera de la ventana de 24 hs"}
                style={{ width: "100%", minHeight: "80px", border: "1px solid #E5E5E5", borderRadius: "10px", padding: "10px 12px", fontSize: "14px", fontFamily: "inherit", resize: "vertical" }} />
              <div style={{ display: "flex", gap: "8px", marginTop: "8px", alignItems: "center" }}>
                <button style={{ ...btnGhost, opacity: busy ? 0.5 : 1 }} disabled={!!busy || !conv.canReply} onClick={suggest}>
                  {busy === "suggest" ? "Pensando…" : "✨ Sugerir respuesta"}
                </button>
                <button style={{ ...btn, opacity: busy || !draft.trim() ? 0.5 : 1 }} disabled={!!busy || !draft.trim() || !conv.canReply} onClick={send}>
                  {busy === "send" ? "Enviando…" : "Enviar"}
                </button>
                <span style={{ fontSize: "11px", color: "#A3A3A3", marginLeft: "auto" }}>Nada se envía sin que toques “Enviar”.</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
