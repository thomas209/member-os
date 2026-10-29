"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Uploader } from "./WeekStories";

// Agenda de la semana: todo lo que sale cada dia (posts, carruseles e
// historias). "Armá mi semana" llena los huecos con PROPUESTAS (borradores
// con fecha) que Tommy revisa y aprueba; nada sale sin su OK.
// En la compu: 7 columnas. En el celu: lista por dia, de arriba hacia abajo.
export type AgendaPost = { id: string; caption: string; mediaUrls: string[]; mediaType: string; status: string; scheduledAt: string | null; publishedAt: string | null; lastError: string | null; productIds?: string[] };
type Account = { handle: string; picture: string | null };
type Slot = { key: string; when: string; format: "post" | "story"; kind: string; title: string; productIds?: string[]; tag?: string | null; presetId?: string };
export type Refill = { day: string; format: string; n: number } | null;

const DAY = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MONTH = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const thumb = (u: string) => (u.includes("/video/upload/") ? u.replace(/\.(mp4|mov|webm)$/i, ".jpg") : u);
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const hhmm = (d: Date) => d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });
const at = (p: AgendaPost) => new Date((p.status === "published" ? p.publishedAt : p.scheduledAt) || 0);
export const isProposal = (p: { status: string; scheduledAt: string | null }) => p.status === "draft" && !!p.scheduledAt;

// Productos que Tommy descarto en esta sesion: el plan no los vuelve a proponer.
const DISCARD_KEY = "cm-descartados";
export function rememberDiscard(ids: string[] = []) {
  try {
    const prev: string[] = JSON.parse(sessionStorage.getItem(DISCARD_KEY) || "[]");
    sessionStorage.setItem(DISCARD_KEY, JSON.stringify([...new Set([...prev, ...ids])].slice(-200)));
  } catch { /* sin storage: no pasa nada */ }
}
function discarded(): string[] {
  try { return JSON.parse(sessionStorage.getItem(DISCARD_KEY) || "[]"); } catch { return []; }
}

function toLocalInput(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
// Fecha sugerida al subir algo a mano en un dia: 20 hs (o en 1 hora si ya paso).
function defaultTime(day: Date) {
  const d = new Date(day); d.setHours(20, 0, 0, 0);
  if (+d < Date.now() + 30 * 60_000) { const n = new Date(Date.now() + 60 * 60_000); n.setMinutes(0, 0, 0); return n; }
  return d;
}

function kind(p: AgendaPost) {
  const video = p.mediaUrls.some((u) => u.includes("/video/upload/"));
  if (p.mediaType === "story") return { label: video ? "Historia · video" : "Historia", bg: "linear-gradient(45deg,#F58529,#DD2A7B,#8134AF)", color: "white" };
  if (p.mediaType === "carousel") return { label: `Carrusel · ${p.mediaUrls.length}`, bg: "#0A0A0A", color: "white" };
  return { label: "Post", bg: "#0A0A0A", color: "white" };
}
function state(p: AgendaPost, now: number) {
  if (isProposal(p)) return +at(p) < now ? { label: "Venció: cambiá la hora", color: "#B45309" } : { label: "Para aprobar", color: "#0A0A0A" };
  if (p.status === "published") return { label: "Publicado", color: "#16A34A" };
  if (p.status === "publishing") return { label: "Publicando…", color: "#2563EB" };
  if (p.status === "paused") return { label: "En pausa" + (p.lastError ? ": " + p.lastError : ""), color: "#B45309" };
  if (p.status === "failed") return { label: "Falló" + (p.lastError ? ": " + p.lastError : ""), color: "#B91C1C" };
  return { label: "Agendado", color: "#525252" };
}

function startOfWeek(d: Date) {
  const x = new Date(d); x.setHours(0, 0, 0, 0);
  const dow = (x.getDay() + 6) % 7; // lunes = 0
  x.setDate(x.getDate() - dow);
  return x;
}

const btn: React.CSSProperties = { background: "#0A0A0A", color: "white", border: "none", borderRadius: "10px", padding: "10px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer" };
const ghost: React.CSSProperties = { ...btn, background: "white", color: "#0A0A0A", border: "1px solid #E5E5E5" };

export default function WeekAgenda({ account, ready, reloadKey, refill, onOpen, onChanged }: {
  account: Account | null; ready: boolean; reloadKey: number; refill?: Refill;
  onOpen: (p: AgendaPost, queue: AgendaPost[]) => void; onChanged: (msg: string) => void;
}) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [items, setItems] = useState<AgendaPost[] | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [adding, setAdding] = useState<Date | null>(null);
  const [menu, setMenu] = useState<Date | null>(null);
  const [mobile, setMobile] = useState(false);
  const [gen, setGen] = useState<{ done: number; total: number; current: string; errors: string[] } | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const stopRef = useRef(false);

  useEffect(() => {
    const f = () => setMobile(window.innerWidth < 760);
    f(); window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);

  const weekEnd = useCallback(() => { const e = new Date(weekStart); e.setDate(e.getDate() + 7); return e; }, [weekStart]);
  const load = useCallback(async () => {
    const r = await fetch(`/api/admin/social/posts?from=${weekStart.toISOString()}&to=${weekEnd().toISOString()}`);
    const j = await r.json().catch(() => ({}));
    setItems(j.items || []);
    setNow(Date.now());
  }, [weekStart, weekEnd]);
  useEffect(() => { load(); }, [load, reloadKey]);

  // Arma las piezas de a una (cada una tarda ~10-30 s) y las va mostrando.
  const fill = useCallback(async (only?: (s: Slot) => boolean) => {
    if (gen) return;
    stopRef.current = false;
    setConfirmAll(false);
    setGen({ done: 0, total: 0, current: "Viendo qué falta esta semana…", errors: [] });
    try {
      const ex = discarded().join(",");
      const r = await fetch(`/api/admin/social/week-plan?weekStart=${weekStart.toISOString()}${ex ? "&exclude=" + ex : ""}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudo planificar");
      const slots: Slot[] = (j.slots || []).filter((s: Slot) => !only || only(s));
      if (!slots.length) { setGen(null); onChanged(only ? "No encontré otra opción para ese día" : "La semana ya está completa"); return; }
      const errors: string[] = [];
      let ok = 0;
      for (let i = 0; i < slots.length; i++) {
        if (stopRef.current) break;
        const s = slots[i];
        const day = DAY[new Date(s.when).getDay()];
        setGen({ done: i, total: slots.length, current: `${day} · ${s.format === "story" ? "Historia" : "Post"}: ${s.title}`, errors });
        const res = await fetch("/api/admin/social/drafts", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productIds: s.productIds, tag: s.tag, format: s.format, presetId: s.presetId, scheduledAt: s.when }),
        });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) {
          errors.push(`${day}: ${d.error || "no se pudo armar"}`);
          // Sin presupuesto de IA, sin clave o sin Instagram no tiene sentido seguir.
          if (res.status === 429 || res.status === 500 || /Instagram/i.test(d.error || "")) break;
          continue;
        }
        ok++;
        load();
      }
      setGen(null);
      if (errors.length) onChanged(`Listas ${ok} · ${errors.length} con error: ${errors[0]}`);
      else onChanged(ok === 1 ? "Propuesta lista para revisar" : `${ok} propuestas listas para revisar`);
      load();
    } catch (e) {
      setGen(null);
      onChanged(e instanceof Error ? e.message : "Error");
    }
  }, [gen, weekStart, load, onChanged]);

  // "Cambiar por otra" desde la revision: rearma solo ese dia y formato.
  const lastRefill = useRef(0);
  useEffect(() => {
    if (!refill || refill.n === lastRefill.current) return;
    lastRefill.current = refill.n;
    const day = new Date(refill.day);
    if (+day < +weekStart || +day >= +weekEnd()) return;
    const fmt = refill.format;
    setTimeout(() => fill((s) => sameDay(new Date(s.when), day) && s.format === fmt), 0);
  }, [refill, fill, weekStart, weekEnd]);

  async function approveAll() {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/social/week-plan/approve", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true, from: weekStart.toISOString(), to: weekEnd().toISOString() }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      onChanged(j.approved ? `Semana aprobada: ${j.approved} pieza${j.approved === 1 ? "" : "s"} agendada${j.approved === 1 ? "" : "s"} ✓` : "No había propuestas para aprobar");
      load();
    } catch (e) { onChanged(e instanceof Error ? e.message : "Error"); }
    finally { setBusy(false); setConfirmAll(false); }
  }

  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });
  const last = days[6];
  const byDay = days.map((d) => (items || []).filter((p) => sameDay(at(p), d)).sort((a, b) => +at(a) - +at(b)));
  const nStories = (items || []).filter((p) => p.mediaType === "story").length;
  const nPosts = (items || []).length - nStories;
  const proposals = (items || []).filter(isProposal).sort((a, b) => +at(a) - +at(b));
  const approvable = proposals.filter((p) => +at(p) > now + 60_000);
  const isPastDay = (d: Date) => { const e = new Date(d); e.setHours(23, 59, 59); return +e < now; };
  const thisWeek = sameDay(weekStart, startOfWeek(today));
  const pastWeek = +weekEnd() < now;
  const move = (n: number) => setWeekStart((w) => { const x = new Date(w); x.setDate(x.getDate() + 7 * n); return x; });

  const navBtn: React.CSSProperties = { border: "1px solid #E5E5E5", background: "white", borderRadius: "10px", padding: "8px 12px", fontSize: "13px", cursor: "pointer" };

  return (
    <div>
      {/* Encabezado */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
        <div style={{ flex: 1, minWidth: "200px" }}>
          <div style={{ fontSize: "16px", fontWeight: 700 }}>
            {thisWeek ? "Esta semana" : "Semana"} · {days[0].getDate()} {MONTH[days[0].getMonth()]} al {last.getDate()} {MONTH[last.getMonth()]}
          </div>
          <div style={{ fontSize: "12px", color: "#737373", marginTop: "2px" }}>
            {items === null ? "Cargando…" : `${nPosts} de 4 posts · ${nStories} de 7 historias${proposals.length ? ` · ${proposals.length} para aprobar` : ""}`}
          </div>
        </div>
        <button style={navBtn} onClick={() => move(-1)} aria-label="Semana anterior" disabled={!!gen}>←</button>
        {!thisWeek && <button style={navBtn} onClick={() => setWeekStart(startOfWeek(new Date()))} disabled={!!gen}>Hoy</button>}
        <button style={navBtn} onClick={() => move(1)} aria-label="Semana siguiente" disabled={!!gen}>→</button>
      </div>

      {/* Acciones del community manager */}
      {!pastWeek && (
        <div style={{ background: "#FAFAFA", border: "1px solid #EDEDED", borderRadius: "14px", padding: "14px", marginBottom: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {gen ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", fontSize: "13px" }}>
                <b>{gen.total ? `Armando ${Math.min(gen.done + 1, gen.total)} de ${gen.total}` : "Planificando"}</b>
                {gen.total > 0 && <button onClick={() => { stopRef.current = true; }} style={{ ...ghost, padding: "4px 10px", fontSize: "12px" }}>Frenar</button>}
              </div>
              <div style={{ height: "4px", background: "#E8E8E8", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${gen.total ? (gen.done / gen.total) * 100 : 5}%`, background: "#0A0A0A", transition: "width 300ms" }} />
              </div>
              <div style={{ fontSize: "12px", color: "#737373", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{gen.current}</div>
            </>
          ) : confirmAll ? (
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", fontSize: "13px" }}>
              <span style={{ flex: 1, minWidth: "200px" }}>Se agendan <b>{approvable.length}</b> pieza{approvable.length === 1 ? "" : "s"} en @{account?.handle} con el día y la hora que tienen. ¿Aprobar?</span>
              <button style={btn} disabled={busy} onClick={approveAll}>{busy ? "Aprobando…" : "Sí, aprobar"}</button>
              <button style={ghost} disabled={busy} onClick={() => setConfirmAll(false)}>No</button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: "200px", fontSize: "13px", color: "#525252" }}>
                {proposals.length
                  ? "Revisá las propuestas: tocá cada una para verla como en Instagram, o aprobá todas juntas."
                  : "Te armo los posts y las historias de la semana con tus productos. Vos revisás y aprobás."}
              </div>
              {!!proposals.length && <button style={ghost} onClick={() => onOpen(proposals[0], proposals)}>Revisar una por una</button>}
              {!!approvable.length && <button style={btn} onClick={() => setConfirmAll(true)}>Aprobar todo ({approvable.length})</button>}
              <button style={proposals.length ? ghost : btn} disabled={!ready || items === null} onClick={() => fill()}>
                {proposals.length || (items || []).length ? "Completar la semana" : "Armá mi semana"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Dias */}
      <div style={mobile
        ? { display: "flex", flexDirection: "column", gap: "10px" }
        : { display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "8px" }}>
        {days.map((d, i) => {
          const isToday = sameDay(d, today);
          const past = isPastDay(d);
          const list = byDay[i];
          return (
            <div key={d.toISOString()} style={{ background: "white", border: "1px solid " + (isToday ? "#0A0A0A" : "#EDEDED"), borderRadius: "14px", padding: "10px", opacity: past && !list.length ? 0.55 : 1, display: "flex", flexDirection: "column", gap: "8px", minHeight: mobile ? undefined : "220px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px", justifyContent: mobile ? "flex-start" : "space-between" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: isToday ? "#0A0A0A" : "#525252" }}>
                  {isToday ? "Hoy" : mobile ? DAY[d.getDay()] : DAY[d.getDay()].slice(0, 3)}
                </span>
                <span style={{ fontSize: mobile ? "13px" : "18px", fontWeight: 700 }}>{d.getDate()} <span style={{ fontSize: "12px", fontWeight: 500, color: "#737373" }}>{MONTH[d.getMonth()]}</span></span>
              </div>

              {list.length === 0 && <div style={{ fontSize: "12px", color: "#A3A3A3" }}>Nada programado</div>}

              {list.map((p, idx) => {
                const k = kind(p), s = state(p, now), t = at(p), prop = isProposal(p);
                // Aviso si hay otra igual a la misma hora (se agendo dos veces).
                const dup = list.some((o, j) => j !== idx && +at(o) === +t && o.mediaType === p.mediaType && o.status !== "published");
                return (
                  <button key={p.id} onClick={() => onOpen(p, prop ? proposals : [])}
                    style={{ display: "flex", flexDirection: mobile ? "row" : "column", gap: "8px", alignItems: mobile ? "center" : "stretch", padding: "6px", border: prop ? "1px dashed #A3A3A3" : "1px solid #F0F0F0", borderRadius: "10px", background: prop ? "white" : "#FAFAFA", cursor: "pointer", textAlign: "left" }}>
                    <div style={{ fontSize: "17px", fontWeight: 800, letterSpacing: "-0.02em", minWidth: mobile ? "54px" : undefined }}>{hhmm(t)}</div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumb(p.mediaUrls[0])} alt="" style={{ width: mobile ? "44px" : "100%", aspectRatio: p.mediaType === "story" ? "9/16" : "4/5", maxHeight: mobile ? "78px" : "150px", objectFit: "cover", borderRadius: "6px", opacity: p.status === "published" ? 0.6 : 1 }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: 0, flex: 1 }}>
                      <span style={{ alignSelf: "flex-start", fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "999px", background: k.bg, color: k.color }}>{k.label}</span>
                      <span style={{ fontSize: "11px", color: s.color, fontWeight: prop ? 700 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</span>
                      {dup && <span style={{ fontSize: "11px", color: "#B45309" }}>⚠ Hay otra a la misma hora</span>}
                      {mobile && p.caption && <span style={{ fontSize: "12px", color: "#525252", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.caption.split("\n")[0]}</span>}
                    </div>
                  </button>
                );
              })}

              {!past && (
                <button disabled={!ready} onClick={() => setMenu(d)}
                  style={{ border: "1px dashed #D4D4D4", borderRadius: "8px", background: "white", padding: "8px 4px", fontSize: "12px", fontWeight: 600, cursor: ready ? "pointer" : "not-allowed", color: "#525252" }}>
                  + Subir algo
                </button>
              )}
            </div>
          );
        })}
      </div>

      {menu && (
        <AddMenu day={menu} onClose={() => setMenu(null)} onStory={() => { setAdding(menu); setMenu(null); }} />
      )}

      {adding && account && (
        <Uploader day={adding} account={account} onClose={() => setAdding(null)} onDone={(m) => { setAdding(null); onChanged(m); load(); }} />
      )}
    </div>
  );
}

// "+ Subir algo": las formas manuales de publicar, con el dia ya elegido.
function AddMenu({ day, onClose, onStory }: { day: Date; onClose: () => void; onStory: () => void }) {
  const fecha = encodeURIComponent(toLocalInput(defaultTime(day)));
  const opt: React.CSSProperties = { display: "block", width: "100%", textAlign: "left", background: "white", border: "1px solid #EDEDED", borderRadius: "12px", padding: "14px", cursor: "pointer", textDecoration: "none", color: "#0A0A0A" };
  const t: React.CSSProperties = { fontSize: "14px", fontWeight: 600 };
  const sub: React.CSSProperties = { fontSize: "12px", color: "#737373", marginTop: "2px" };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: "18px 18px 0 0", padding: "20px 16px 28px", width: "100%", maxWidth: "520px", display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
          <div style={{ fontSize: "16px", fontWeight: 700 }}>Subir algo · {day.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "numeric" })}</div>
          <button onClick={onClose} style={{ ...ghost, padding: "4px 10px" }}>✕</button>
        </div>
        <button style={opt} onClick={onStory}>
          <div style={t}>Historia con tu foto o video</div>
          <div style={sub}>Subís desde el celu o la compu y elegís la hora.</div>
        </button>
        <Link style={opt} href={`/admin/social/crear?fecha=${fecha}`}>
          <div style={t}>Post o carrusel con productos</div>
          <div style={sub}>Elegís los productos, la IA escribe el texto y vos lo ajustás.</div>
        </Link>
        <Link style={opt} href={`/admin/social/referencia?fecha=${fecha}`}>
          <div style={t}>Copiar el estilo de un ejemplo</div>
          <div style={sub}>Subís un post que te guste y lo armo con tus fotos y tu logo.</div>
        </Link>
        <Link style={opt} href={`/admin/social/crear?fecha=${fecha}#anuncio`}>
          <div style={t}>Anuncio</div>
          <div style={sub}>Horarios, feriados o cualquier aviso con tu texto.</div>
        </Link>
      </div>
    </div>
  );
}
