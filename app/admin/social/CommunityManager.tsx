"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import InstagramPreview from "./InstagramPreview";
import StoryPreview from "./StoryPreview";

type Account = { handle: string; picture: string | null; status: string } | null;
type Suggestion = {
  id: string; kind: string; title: string; description: string;
  productIds?: string[]; tag?: string; format?: "post" | "story"; presetId?: string; priority: number;
};
type Post = {
  id: string; caption: string; mediaUrls: string[]; mediaType: string; status: string;
  scheduledAt: string | null; publishedAt: string | null; permalink: string | null; lastError: string | null; createdAt: string;
};

const btn: React.CSSProperties = { background: "#0A0A0A", color: "white", border: "none", borderRadius: "10px", padding: "10px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer" };
const ghost: React.CSSProperties = { ...btn, background: "white", color: "#0A0A0A", border: "1px solid #E5E5E5" };
const card: React.CSSProperties = { background: "white", border: "1px solid #EDEDED", borderRadius: "14px", padding: "18px" };
const h2: React.CSSProperties = { fontSize: "15px", fontWeight: 700, margin: "36px 0 12px" };

const ICON: Record<string, string> = { nuevos: "✦", nuevo: "✦", restock: "↺", oferta: "%", ultimos: "!", frecuencia: "◷", horarios: "⌂" };

function fmt(d: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleString("es-AR", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
// Sugerencias de horario: los momentos en que mas se mira Instagram en Argentina.
function quickTimes() {
  const out: { label: string; date: Date }[] = [];
  const now = new Date();
  const at = (days: number, h: number) => { const d = new Date(now); d.setDate(d.getDate() + days); d.setHours(h, 0, 0, 0); return d; };
  for (const [label, d] of [["Hoy 13:00", at(0, 13)], ["Hoy 20:00", at(0, 20)], ["Mañana 13:00", at(1, 13)], ["Mañana 20:00", at(1, 20)]] as const) {
    if (+d > Date.now() + 15 * 60_000) out.push({ label, date: d });
  }
  return out.slice(0, 3);
}
function toLocalInput(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function CommunityManager({ account, hasVoice, unread, urgent, spent, budget, openId }: {
  account: Account; hasVoice: boolean; unread: number; urgent: number; spent: number; budget: number; openId?: string;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [posts, setPosts] = useState<{ upcoming: Post[]; drafts: Post[]; recent: Post[] }>({ upcoming: [], drafts: [], recent: [] });
  const [building, setBuilding] = useState<string>("");
  const [open, setOpen] = useState<Post | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    const [s, p] = await Promise.all([
      fetch("/api/admin/social/suggestions").then((r) => r.json()).catch(() => ({ suggestions: [] })),
      fetch("/api/admin/social/posts").then((r) => r.json()).catch(() => null),
    ]);
    setSuggestions(s.suggestions || []);
    if (p?.upcoming) setPosts(p);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Viene de "Crear borrador" en la ficha del producto: abre ese borrador.
  const [openedFromUrl, setOpenedFromUrl] = useState(false);
  useEffect(() => {
    if (!openId || openedFromUrl) return;
    const all = [...posts.drafts, ...posts.upcoming, ...posts.recent];
    const p = all.find((x) => x.id === openId);
    if (p) { setOpen(p); setOpenedFromUrl(true); window.history.replaceState(null, "", "/admin/social"); }
  }, [openId, openedFromUrl, posts]);

  // En local no hay cron: mientras el panel esta abierto, cada minuto se
  // publica lo agendado que ya vencio. En produccion lo hace el cron.
  useEffect(() => {
    const t = setInterval(async () => {
      const r = await fetch("/api/admin/social/run-due", { method: "POST" }).then((x) => x.json()).catch(() => null);
      if (r?.results?.length) { setToast(r.results.some((x: { ok: boolean }) => x.ok) ? "Se publicó un post agendado" : "Un post agendado no se pudo publicar"); load(); }
    }, 60_000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 5000); return () => clearTimeout(t); }, [toast]);

  async function build(s: Suggestion) {
    setBuilding(s.id); setError("");
    try {
      const r = await fetch("/api/admin/social/drafts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: s.productIds, tag: s.tag, format: s.format, presetId: s.presetId }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudo armar");
      setOpen(j.post);
      load();
    } catch (e) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setBuilding(""); }
  }

  const ready = account && account.status === "active";
  const visible = (suggestions || []).filter((s) => s.kind !== "frecuencia");
  const reminder = (suggestions || []).find((s) => s.kind === "frecuencia");

  return (
    <div style={{ padding: "48px", maxWidth: "1000px" }}>
      <h1 style={{ fontSize: "26px", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "4px" }}>Tu community manager</h1>
      <p style={{ fontSize: "14px", color: "#737373" }}>Te propongo qué publicar con lo que pasa en la tienda. Vos solo elegís, revisás y aprobás.</p>

      {/* Estado rapido */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginTop: "24px" }}>
        <div style={card}>
          <div style={{ fontSize: "12px", color: "#737373" }}>Instagram</div>
          <div style={{ fontSize: "15px", fontWeight: 600, marginTop: "4px" }}>{ready ? "@" + account!.handle : account ? "Reconectar" : "Sin conectar"}</div>
        </div>
        <Link href="/admin/social/inbox" style={{ ...card, textDecoration: "none", color: "inherit" }}>
          <div style={{ fontSize: "12px", color: "#737373" }}>Mensajes sin leer</div>
          <div style={{ fontSize: "15px", fontWeight: 600, marginTop: "4px" }}>{unread}{urgent ? ` · ${urgent} de hoy` : ""} →</div>
        </Link>
        <div style={card}>
          <div style={{ fontSize: "12px", color: "#737373" }}>Agendados</div>
          <div style={{ fontSize: "15px", fontWeight: 600, marginTop: "4px" }}>{posts.upcoming.length ? `${posts.upcoming.length} · próximo ${fmt(posts.upcoming[0].scheduledAt)}` : "Nada agendado"}</div>
        </div>
      </div>

      {/* Primeros pasos, solo si falta algo */}
      {(!ready || !hasVoice) && (
        <div style={{ ...card, marginTop: "16px", background: "#FAFAFA" }}>
          <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "8px" }}>Antes de empezar</div>
          {!ready && <p style={{ fontSize: "13px", margin: "4px 0" }}>1. Conectá tu Instagram en <Link href="/admin/social/crear">Crear a mano</Link>.</p>}
          {!hasVoice && <p style={{ fontSize: "13px", margin: "4px 0" }}>2. Analizá tu perfil para que aprenda cómo escribe la marca (en <Link href="/admin/social/crear">Crear a mano</Link> → Voz).</p>}
        </div>
      )}

      {reminder && (
        <div style={{ ...card, marginTop: "16px", borderColor: "#F5D48A", background: "#FFFBEB", fontSize: "13px" }}>
          <b>{reminder.title}.</b> {reminder.description}
        </div>
      )}

      {error && <div style={{ ...card, marginTop: "16px", borderColor: "#FCA5A5", background: "#FEF2F2", fontSize: "13px", color: "#991B1B" }}>{error}</div>}

      <h2 style={h2}>Para hoy</h2>
      {suggestions === null ? (
        <p style={{ fontSize: "13px", color: "#737373" }}>Mirando la tienda…</p>
      ) : !visible.length ? (
        <div style={{ ...card, fontSize: "13px", color: "#737373" }}>
          No hay novedades para publicar hoy. Si querés, armá algo en <Link href="/admin/social/crear">Crear a mano</Link>.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
          {visible.map((s) => (
            <div key={s.id} style={{ ...card, display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <span style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#F4F4F4", display: "grid", placeItems: "center", fontSize: "14px" }}>{ICON[s.kind] || "•"}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "14px" }}>{s.title}</div>
                  <div style={{ fontSize: "11px", color: "#A3A3A3", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {s.format === "story" ? "Historia" : (s.productIds?.length || 0) > 1 ? "Carrusel" : "Post"}
                  </div>
                </div>
              </div>
              <p style={{ fontSize: "13px", color: "#525252", margin: 0, flex: 1 }}>{s.description}</p>
              <button style={{ ...btn, opacity: !ready || !!building ? 0.5 : 1 }} disabled={!ready || !!building} onClick={() => build(s)}>
                {building === s.id ? "Armando… (≈30 s)" : "Armalo"}
              </button>
            </div>
          ))}
        </div>
      )}

      {!!posts.drafts.length && (
        <>
          <h2 style={h2}>Borradores para revisar</h2>
          <PostList posts={posts.drafts} onOpen={setOpen} />
        </>
      )}

      <h2 style={h2}>Agendados</h2>
      {posts.upcoming.length ? <PostList posts={posts.upcoming} onOpen={setOpen} /> : <p style={{ fontSize: "13px", color: "#737373" }}>Nada agendado todavía.</p>}

      {!!posts.recent.length && (
        <>
          <h2 style={h2}>Publicados</h2>
          <PostList posts={posts.recent} onOpen={setOpen} />
        </>
      )}

      <p style={{ fontSize: "11px", color: "#A3A3A3", marginTop: "40px" }}>
        IA este mes: USD {spent.toFixed(2)} de {budget}. Nada se publica sin tu OK.
      </p>

      {open && account && (
        <Review post={open} account={account} onClose={() => setOpen(null)} onDone={(m) => { setOpen(null); setToast(m); load(); }} />
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", background: "#0A0A0A", color: "white", padding: "12px 18px", borderRadius: "999px", fontSize: "13px", zIndex: 60 }}>{toast}</div>
      )}
    </div>
  );
}

function statusLabel(p: Post) {
  if (p.status === "published") return "Publicado " + fmt(p.publishedAt);
  if (p.status === "approved") return "Sale " + fmt(p.scheduledAt);
  if (p.status === "publishing") return "Publicando…";
  if (p.status === "paused") return "En pausa: " + (p.lastError || "");
  if (p.status === "failed") return "No se pudo publicar: " + (p.lastError || "");
  return "Borrador";
}

function PostList({ posts, onOpen }: { posts: Post[]; onOpen: (p: Post) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px" }}>
      {posts.map((p) => (
        <button key={p.id} onClick={() => (p.status === "published" && p.permalink ? window.open(p.permalink, "_blank") : onOpen(p))}
          style={{ textAlign: "left", background: "white", border: "1px solid #EDEDED", borderRadius: "12px", padding: 0, overflow: "hidden", cursor: "pointer" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.mediaUrls[0]} alt="" style={{ width: "100%", aspectRatio: p.mediaType === "story" ? "9/16" : "4/5", objectFit: "cover", display: "block", maxHeight: "220px" }} />
          <div style={{ padding: "8px 10px", fontSize: "11px", color: p.status === "failed" || p.status === "paused" ? "#B91C1C" : "#525252" }}>
            {p.mediaType === "story" ? "Historia · " : p.mediaUrls.length > 1 ? "Carrusel · " : ""}{statusLabel(p)}
          </div>
        </button>
      ))}
    </div>
  );
}

function Review({ post, account, onClose, onDone }: {
  post: Post; account: NonNullable<Account>; onClose: () => void; onDone: (msg: string) => void;
}) {
  const [caption, setCaption] = useState(post.caption);
  const [when, setWhen] = useState(post.scheduledAt ? toLocalInput(new Date(post.scheduledAt)) : "");
  const [confirming, setConfirming] = useState<"" | "now" | "schedule">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isStory = post.mediaType === "story";
  const editable = ["draft", "approved", "paused", "failed"].includes(post.status);

  async function call(url: string, body?: object, method = "POST") {
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "Error");
    return j;
  }
  async function saveCaption() {
    if (!isStory && caption !== post.caption) await call(`/api/admin/social/posts/${post.id}`, { caption }, "PATCH");
  }
  async function run(fn: () => Promise<void>) {
    setBusy(true); setError("");
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : "Error"); setConfirming(""); }
    finally { setBusy(false); }
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "grid", placeItems: "center", zIndex: 50, padding: "24px", overflow: "auto" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: "18px", padding: "24px", display: "flex", gap: "28px", flexWrap: "wrap", maxWidth: "860px", width: "100%" }}>
        <div>
          {isStory
            ? <StoryPreview handle={account.handle} picture={account.picture} images={post.mediaUrls} />
            : <InstagramPreview handle={account.handle} picture={account.picture} images={post.mediaUrls} caption={caption} />}
        </div>
        <div style={{ flex: 1, minWidth: "280px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 700, fontSize: "16px" }}>{isStory ? "Historia" : "Post"} · {statusLabel(post)}</div>
            <button onClick={onClose} style={{ ...ghost, padding: "4px 10px" }}>✕</button>
          </div>
          {!isStory && (
            <>
              <label style={{ fontSize: "12px", color: "#737373" }}>Texto (podés cambiarlo)</label>
              <textarea value={caption} onChange={(e) => setCaption(e.target.value)} disabled={!editable} rows={10}
                style={{ width: "100%", border: "1px solid #E5E5E5", borderRadius: "10px", padding: "10px", fontSize: "13px", fontFamily: "inherit", resize: "vertical" }} />
            </>
          )}
          {error && <div style={{ fontSize: "13px", color: "#B91C1C" }}>{error}</div>}

          {editable && (
            <>
              <div style={{ fontSize: "12px", color: "#737373", marginTop: "4px" }}>¿Cuándo sale?</div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {quickTimes().map((q) => (
                  <button key={q.label} style={{ ...ghost, padding: "6px 10px", fontSize: "12px", background: when === toLocalInput(q.date) ? "#F4F4F4" : "white" }} onClick={() => { setWhen(toLocalInput(q.date)); setConfirming(""); }}>{q.label}</button>
                ))}
                <input type="datetime-local" value={when} onChange={(e) => { setWhen(e.target.value); setConfirming(""); }}
                  style={{ border: "1px solid #E5E5E5", borderRadius: "10px", padding: "6px 8px", fontSize: "12px" }} />
              </div>

              {confirming === "schedule" ? (
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{ fontSize: "13px" }}>¿Agendar para {fmt(new Date(when).toISOString())}?</span>
                  <button style={btn} disabled={busy} onClick={() => run(async () => { await saveCaption(); await call(`/api/admin/social/posts/${post.id}/schedule`, { confirm: true, scheduledAt: new Date(when).toISOString() }); onDone("Agendado ✓"); })}>{busy ? "…" : "Sí, agendar"}</button>
                  <button style={ghost} onClick={() => setConfirming("")}>No</button>
                </div>
              ) : confirming === "now" ? (
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{ fontSize: "13px" }}>Se publica ya en @{account.handle}. ¿Seguro?</span>
                  <button style={btn} disabled={busy} onClick={() => run(async () => { await saveCaption(); await call(`/api/admin/social/posts/${post.id}/publish`, { confirm: true }); onDone("Publicado en Instagram ✓"); })}>{busy ? "Publicando…" : "Sí, publicar"}</button>
                  <button style={ghost} onClick={() => setConfirming("")}>No</button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button style={{ ...btn, opacity: when ? 1 : 0.5 }} disabled={!when} onClick={() => setConfirming("schedule")}>Agendar</button>
                  <button style={ghost} onClick={() => setConfirming("now")}>Publicar ahora</button>
                  {!isStory && caption !== post.caption && (
                    <button style={ghost} disabled={busy} onClick={() => run(async () => { await saveCaption(); onDone("Texto guardado"); })}>Guardar texto</button>
                  )}
                </div>
              )}

              <div style={{ display: "flex", gap: "8px", marginTop: "auto", paddingTop: "12px", borderTop: "1px solid #F0F0F0" }}>
                {post.status === "approved" ? (
                  <button style={{ ...ghost, color: "#B91C1C" }} disabled={busy} onClick={() => run(async () => { await call(`/api/admin/social/posts/${post.id}/cancel`); onDone("Sacado de la agenda"); })}>Sacar de la agenda</button>
                ) : (
                  <button style={{ ...ghost, color: "#B91C1C" }} disabled={busy} onClick={() => run(async () => { await call(`/api/admin/social/posts/${post.id}`, undefined, "DELETE"); onDone("Descartado"); })}>Descartar</button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
