"use client";
import { useCallback, useEffect, useState } from "react";
import { Uploader } from "./WeekStories";

// Agenda de la semana: todo lo que sale cada dia (posts, carruseles e
// historias) con fecha, hora, tipo y estado. En la compu: 7 columnas.
// En el celu: lista por dia, de arriba hacia abajo.
type Post = { id: string; caption: string; mediaUrls: string[]; mediaType: string; status: string; scheduledAt: string | null; publishedAt: string | null; lastError: string | null };
type Account = { handle: string; picture: string | null };

const DAY = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MONTH = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const thumb = (u: string) => (u.includes("/video/upload/") ? u.replace(/\.(mp4|mov|webm)$/i, ".jpg") : u);
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const hhmm = (d: Date) => d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });
const at = (p: Post) => new Date((p.status === "published" ? p.publishedAt : p.scheduledAt) || 0);

function kind(p: Post) {
  const video = p.mediaUrls.some((u) => u.includes("/video/upload/"));
  if (p.mediaType === "story") return { label: video ? "Historia · video" : "Historia", bg: "linear-gradient(45deg,#F58529,#DD2A7B,#8134AF)", color: "white" };
  if (p.mediaType === "carousel") return { label: `Carrusel · ${p.mediaUrls.length}`, bg: "#0A0A0A", color: "white" };
  return { label: "Post", bg: "#0A0A0A", color: "white" };
}
function state(p: Post) {
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

export default function WeekAgenda({ account, ready, reloadKey, onOpen, onChanged }: {
  account: Account | null; ready: boolean; reloadKey: number; onOpen: (p: Post) => void; onChanged: (msg: string) => void;
}) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [items, setItems] = useState<Post[] | null>(null);
  const [adding, setAdding] = useState<Date | null>(null);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const f = () => setMobile(window.innerWidth < 760);
    f(); window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);

  const load = useCallback(async () => {
    const end = new Date(weekStart); end.setDate(end.getDate() + 7);
    const r = await fetch(`/api/admin/social/posts?from=${weekStart.toISOString()}&to=${end.toISOString()}`);
    const j = await r.json().catch(() => ({}));
    setItems(j.items || []);
  }, [weekStart]);
  useEffect(() => { load(); }, [load, reloadKey]);

  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });
  const last = days[6];
  const byDay = days.map((d) => (items || []).filter((p) => sameDay(at(p), d)).sort((a, b) => +at(a) - +at(b)));
  const nStories = (items || []).filter((p) => p.mediaType === "story").length;
  const nPosts = (items || []).length - nStories;
  const isPastDay = (d: Date) => { const e = new Date(d); e.setHours(23, 59, 59); return +e < Date.now(); };
  const thisWeek = sameDay(weekStart, startOfWeek(today));
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
            {items === null ? "Cargando…" : `${nPosts} post${nPosts === 1 ? "" : "s"} · ${nStories} historia${nStories === 1 ? "" : "s"}`}
          </div>
        </div>
        <button style={navBtn} onClick={() => move(-1)} aria-label="Semana anterior">←</button>
        {!thisWeek && <button style={navBtn} onClick={() => setWeekStart(startOfWeek(new Date()))}>Hoy</button>}
        <button style={navBtn} onClick={() => move(1)} aria-label="Semana siguiente">→</button>
      </div>

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
                const k = kind(p), s = state(p), t = at(p);
                // Aviso si hay otra igual a la misma hora (se agendo dos veces).
                const dup = list.some((o, j) => j !== idx && +at(o) === +t && o.mediaType === p.mediaType && o.status !== "published");
                return (
                  <button key={p.id} onClick={() => onOpen(p)}
                    style={{ display: "flex", flexDirection: mobile ? "row" : "column", gap: "8px", alignItems: mobile ? "center" : "stretch", padding: "6px", border: "1px solid #F0F0F0", borderRadius: "10px", background: "#FAFAFA", cursor: "pointer", textAlign: "left" }}>
                    <div style={{ fontSize: "17px", fontWeight: 800, letterSpacing: "-0.02em", minWidth: mobile ? "54px" : undefined }}>{hhmm(t)}</div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumb(p.mediaUrls[0])} alt="" style={{ width: mobile ? "44px" : "100%", aspectRatio: p.mediaType === "story" ? "9/16" : "4/5", maxHeight: mobile ? "78px" : "150px", objectFit: "cover", borderRadius: "6px", opacity: p.status === "published" ? 0.6 : 1 }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: 0, flex: 1 }}>
                      <span style={{ alignSelf: "flex-start", fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "999px", background: k.bg, color: k.color }}>{k.label}</span>
                      <span style={{ fontSize: "11px", color: s.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</span>
                      {dup && <span style={{ fontSize: "11px", color: "#B45309" }}>⚠ Hay otra a la misma hora</span>}
                      {mobile && p.caption && <span style={{ fontSize: "12px", color: "#525252", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.caption.split("\n")[0]}</span>}
                    </div>
                  </button>
                );
              })}

              {!past && (
                <button disabled={!ready} onClick={() => setAdding(d)}
                  style={{ border: "1px dashed #D4D4D4", borderRadius: "8px", background: "white", padding: "8px 4px", fontSize: "12px", fontWeight: 600, cursor: ready ? "pointer" : "not-allowed", color: "#525252" }}>
                  + Historia
                </button>
              )}
            </div>
          );
        })}
      </div>

      {adding && account && (
        <Uploader day={adding} account={account} onClose={() => setAdding(null)} onDone={(m) => { setAdding(null); onChanged(m); load(); }} />
      )}
    </div>
  );
}
