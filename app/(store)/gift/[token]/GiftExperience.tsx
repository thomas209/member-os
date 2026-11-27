"use client";
import { useEffect, useState } from "react";

const LOGO = "https://res.cloudinary.com/dklvmlzds/image/upload/v1783912898/MEMBER_B_1_3_wyfasx.png";

type Claimed = { code: string; email: string; validUntil: string | null };
type Props = { token: string; percent: number; minAmount: number | null; days: number; username: string | null; claimed: Claimed | null };

const fecha = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "long", timeZone: "America/Argentina/Buenos_Aires" }) : "";

// Sobre cerrado -> la persona carga sus datos -> el sobre se abre, sale la
// gift card con su codigo. Si ya la habia pedido, la ve abierta directamente.
export default function GiftExperience({ token, percent, minAmount, days, username, claimed }: Props) {
  const [phase, setPhase] = useState<"closed" | "opening" | "rising" | "open">(claimed ? "open" : "closed");
  const [data, setData] = useState<Claimed | null>(claimed);
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    if (phase === "opening") { const t = setTimeout(() => setPhase("rising"), 700); return () => clearTimeout(t); }
    if (phase === "rising") { const t = setTimeout(() => setPhase("open"), 1100); return () => clearTimeout(t); }
  }, [phase]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/gift/claim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, ...f }) });
      const d = await res.json();
      if (!res.ok) { setError(d.error || "Algo salió mal"); setLoading(false); return; }
      setData({ code: d.code, email: d.email, validUntil: d.validUntil || null });
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => setPhase("opening"), 350);
    } catch {
      setError("Error de conexión"); setLoading(false);
    }
  };

  const copy = async () => {
    if (!data) return;
    try { await navigator.clipboard.writeText(data.code); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  };

  const open = phase === "open";
  return (
    <div className={"gx gx-" + phase}>
      <style>{CSS}</style>
      <p className="co-label" style={{ textAlign: "center" }}>{open ? "Tu regalo" : "Para vos" + (username ? ", @" + username : "")}</p>
      <h1 className="co-titulo" style={{ textAlign: "center", fontSize: 28, margin: "4px 0 22px" }}>
        {open ? "¡Ya es tuya!" : "Tenés una gift card"}
      </h1>

      <div className="gx-stage">
        <div className="gx-env">
          <div className="gx-env-back" />
          <div className="gx-card">
            <div className="gx-card-in">
              <div className="gx-row"><img src={LOGO} alt="Member Club" className="gx-logo" /><span className="gx-tag">GIFT CARD</span></div>
              <div className="gx-big">{percent}% <span>OFF</span></div>
              <div className="gx-sub">Primera compra · pagando por transferencia</div>
              <div className="gx-foot">
                <div><small>Código</small><b>{data?.code || "GIFT-••••••"}</b></div>
                <div style={{ textAlign: "right" }}><small>Válida hasta</small><b>{data?.validUntil ? fecha(data.validUntil) : days + " días"}</b></div>
              </div>
            </div>
          </div>
          <div className="gx-env-front" />
          <div className="gx-flap" />
          <div className="gx-seal"><img src={LOGO} alt="" /></div>
        </div>
      </div>

      {open && data ? (
        <div className="gx-after">
          <button type="button" className="gx-copy" onClick={copy}>{copied ? "¡Copiado!" : "Copiar código " + data.code}</button>
          <p className="gx-note">Te lo mandamos también a <b>{data.email}</b>. Usalo en el checkout, en &quot;Cupón&quot;, eligiendo pagar por transferencia{minAmount ? ", en compras desde $" + minAmount.toLocaleString("es-AR") : ""}. Un solo uso, con este mismo email.</p>
          <a href="/catalog" className="cart-cta" style={{ marginTop: 18 }}>Ir a la tienda</a>
        </div>
      ) : phase === "closed" ? (
        <form onSubmit={submit} style={{ marginTop: 26 }}>
          <p style={{ textAlign: "center", fontSize: 15, color: "#525252", margin: "0 0 22px", lineHeight: 1.5 }}>
            Completá tus datos para abrirla: adentro hay <b>{percent}% OFF</b> para tu primera compra en la web.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }} className="co-fila">
            <div><label className="co-label">Nombre</label><input className="co-campo" value={f.firstName} onChange={set("firstName")} autoComplete="given-name" required /></div>
            <div><label className="co-label">Apellido</label><input className="co-campo" value={f.lastName} onChange={set("lastName")} autoComplete="family-name" required /></div>
          </div>
          <div className="co-fila"><label className="co-label">Email</label><input className="co-campo" type="email" value={f.email} onChange={set("email")} autoComplete="email" required /></div>
          <div className="co-fila"><label className="co-label">Teléfono (opcional)</label><input className="co-campo" type="tel" value={f.phone} onChange={set("phone")} autoComplete="tel" placeholder="11 2345 6789" /></div>
          {error && <p style={{ color: "#DC2626", fontSize: 14, margin: "4px 0 12px" }}>{error}</p>}
          <button className="cart-cta" type="submit" disabled={loading} style={{ marginTop: 8, opacity: loading ? 0.6 : 1 }}>
            {loading ? "Abriendo..." : "Abrir mi gift card"}
          </button>
          <p style={{ fontSize: 12, color: "#A3A3A3", textAlign: "center", marginTop: 12 }}>Tus datos quedan guardados en Member Club para mandarte la gift card y novedades.</p>
        </form>
      ) : null}
    </div>
  );
}

const CSS = `
.gx-stage{position:relative;height:300px;display:flex;align-items:flex-end;justify-content:center;perspective:1200px}
.gx-env{position:relative;width:300px;height:190px;transition:transform .6s cubic-bezier(.32,.72,0,1),opacity .5s ease}
.gx-env-back{position:absolute;inset:0;background:#141414;border-radius:14px}
.gx-env-front{position:absolute;inset:0;border-radius:14px;background:#1d1d1d;clip-path:polygon(0 30%,50% 64%,100% 30%,100% 100%,0 100%);z-index:3;box-shadow:inset 0 1px 0 rgba(255,255,255,.06)}
.gx-flap{position:absolute;left:0;right:0;top:0;height:62%;background:#232323;clip-path:polygon(0 0,100% 0,50% 100%);transform-origin:top center;transition:transform .7s cubic-bezier(.4,0,.2,1),z-index 0s .35s;z-index:4;border-radius:14px 14px 0 0}
.gx-seal{position:absolute;left:50%;top:52%;width:58px;height:58px;margin:-29px 0 0 -29px;border-radius:50%;background:#F6F0E4;display:flex;align-items:center;justify-content:center;z-index:5;box-shadow:0 4px 12px rgba(0,0,0,.35);transition:opacity .25s ease,transform .3s ease}
.gx-seal img{width:40px;height:auto}
.gx-card{position:absolute;left:12px;right:12px;bottom:10px;height:170px;z-index:2;transition:transform 1.1s cubic-bezier(.32,.72,0,1)}
.gx-card-in{height:100%;border-radius:14px;padding:16px 16px 14px;box-sizing:border-box;color:#F6F0E4;display:flex;flex-direction:column;justify-content:space-between;
  background:radial-gradient(120% 140% at 0% 0%,#3a3a3a 0%,#121212 55%,#000 100%);box-shadow:0 18px 40px rgba(0,0,0,.25),inset 0 0 0 1px rgba(246,240,228,.12)}
.gx-row{display:flex;justify-content:space-between;align-items:center}
.gx-logo{height:22px;width:auto;filter:invert(1)}
.gx-tag{font-family:var(--font-name),ui-monospace,monospace;font-size:10px;letter-spacing:.2em;opacity:.8}
.gx-big{font-family:var(--font-price),'Helvetica Neue',Arial,sans-serif;font-weight:600;font-size:44px;letter-spacing:-.03em;line-height:1;white-space:nowrap}
.gx-big span{font-size:.6em;letter-spacing:0}
.gx-sub{font-size:11px;opacity:.75;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gx-foot{display:flex;justify-content:space-between;gap:10px;font-size:12px}
.gx-foot small{display:block;font-family:var(--font-name),ui-monospace,monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;opacity:.6;margin-bottom:2px}
.gx-foot b{font-family:var(--font-name),ui-monospace,monospace;letter-spacing:.06em}
/* animacion */
.gx-closed .gx-card{opacity:0}
.gx-card{transition:transform 1.1s cubic-bezier(.32,.72,0,1),opacity .2s ease}
.gx-opening .gx-flap,.gx-rising .gx-flap,.gx-open .gx-flap{transform:rotateX(180deg);z-index:1}
.gx-opening .gx-seal,.gx-rising .gx-seal,.gx-open .gx-seal{opacity:0;transform:scale(.6)}
.gx-rising .gx-card{transform:translateY(-130px)}
.gx-open .gx-env{transform:translateY(40px)}
.gx-open .gx-env-back,.gx-open .gx-env-front,.gx-open .gx-flap{opacity:0;transition:opacity .4s ease}
.gx-open .gx-card{transform:translateY(-70px) scale(1.12);transition:transform .6s cubic-bezier(.32,.72,0,1)}
.gx-open .gx-card-in{animation:gxBrillo 1.2s ease .2s both}
@keyframes gxBrillo{0%{box-shadow:0 18px 40px rgba(0,0,0,.25),inset 0 0 0 1px rgba(246,240,228,.12)}40%{box-shadow:0 24px 60px rgba(0,0,0,.35),0 0 0 6px rgba(246,240,228,.25),inset 0 0 0 1px rgba(246,240,228,.3)}100%{box-shadow:0 22px 50px rgba(0,0,0,.3),inset 0 0 0 1px rgba(246,240,228,.14)}}
.gx-after{text-align:center;animation:gxSube .5s ease .25s both}
@keyframes gxSube{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.gx-copy{display:inline-block;margin-top:6px;padding:12px 20px;border-radius:999px;border:1px solid #0A0A0A;background:#fff;font-family:var(--font-name),ui-monospace,monospace;font-size:14px;letter-spacing:.04em;cursor:pointer}
.gx-note{font-size:13px;color:#6E6E73;line-height:1.5;margin:14px 0 0}
@media (prefers-reduced-motion: reduce){.gx *{transition:none!important;animation:none!important}}
`;
