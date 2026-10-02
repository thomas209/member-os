export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CopyPill from "@/components/store/CopyPill";
import { buildWhatsappLink } from "@/lib/whatsapp";
import { STORE_WHATSAPP_NUMBER } from "@/lib/bankDetails";

// Pagina publica de seguimiento de un pedido, con la estetica de la marca.
// Se entra con el id largo del pedido (el mismo criterio que /receipt/[id]):
// solo lo conoce quien recibio el link. No muestra telefono, mail ni direccion exacta.
//
// FASE 2 (pendiente): cuando haya credenciales de la API de Andreani, el estado
// "en vivo" de cada envio se suma aca (ver andreaniUrl / bloque de cada envio).

const andreaniUrl = (n: string) => "https://www.andreani.com/#!/informacionEnvio/" + encodeURIComponent(n);
const nro = (n: number) => "#" + String(n).padStart(4, "0");
const fecha = (d: Date) =>
  d.toLocaleDateString("es-AR", { day: "numeric", month: "long", timeZone: "America/Argentina/Buenos_Aires" });

async function getOrder(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: { product: { include: { images: { orderBy: { isPrimary: "desc" }, take: 1 } } } },
      },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) return { title: "Pedido no encontrado" };
  return {
    title: `Seguimiento del pedido ${nro(order.orderNumber)}`,
    description: "Seguí el estado de tu pedido de Member Club.",
    robots: { index: false, follow: false },
  };
}

const PASOS = ["Confirmado", "Preparando", "Despachado", "Entregado"];

export default async function SeguimientoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const enviados = order.items.filter((i) => i.shippedAt && i.trackingNumber);
  const pendientes = order.items.filter((i) => !i.shippedAt);
  const parcial = enviados.length > 0 && pendientes.length > 0;
  const cancelado = order.status === "CANCELLED" || order.status === "REFUNDED";

  // Paso actual de la linea de tiempo (0 a 3). -1 = todavia esperando el pago.
  const paso =
    order.status === "DELIVERED" ? 3 :
    order.status === "SHIPPED" ? 2 :
    order.status === "PROCESSING" ? 1 :
    order.status === "PAID" ? 0 : -1;

  const titulo =
    order.status === "DELIVERED" ? "Entregado" :
    order.status === "SHIPPED" ? "En camino" :
    order.status === "PROCESSING" ? (parcial ? "Una parte ya salió" : "Preparando tu pedido") :
    order.status === "PAID" ? "Pedido confirmado" :
    order.status === "CANCELLED" ? "Pedido cancelado" :
    order.status === "REFUNDED" ? "Pedido reembolsado" :
    "Esperando el pago";

  const bajada =
    order.status === "DELIVERED" ? "Tu pedido ya llegó. ¡Que lo disfrutes!" :
    order.status === "SHIPPED" ? "Tu pedido ya salió. Seguilo con el número de seguimiento de abajo." :
    order.status === "PROCESSING" ? (parcial ? "El resto lo despachamos por separado: te avisamos apenas salga." : "Lo estamos preparando para despachar. Te avisamos apenas salga.") :
    order.status === "PAID" ? "Recibimos tu compra. En breve empezamos a prepararla." :
    order.status === "CANCELLED" ? "Este pedido fue cancelado. Si tenés dudas, escribinos." :
    order.status === "REFUNDED" ? "Este pedido fue reembolsado. Si tenés dudas, escribinos." :
    order.paymentMethod === "TRANSFERENCIA" ? "Apenas veamos acreditada la transferencia, lo confirmamos y empezamos a prepararlo." :
    "Todavía no se acreditó el pago. Apenas se confirme, empezamos a prepararlo.";

  // Envios agrupados por numero de seguimiento (un pedido puede salir en varias tandas)
  const envios = new Map<string, typeof enviados>();
  for (const it of enviados) {
    const k = it.trackingNumber as string;
    envios.set(k, [...(envios.get(k) || []), it]);
  }

  const addr = (order.shippingAddress || {}) as Record<string, string | undefined>;
  const destino = [addr.city, addr.province].filter(Boolean).join(", ");

  const fechasPaso: (string | null)[] = [
    paso >= 0 ? fecha(order.createdAt) : null,
    null,
    enviados.length ? fecha(enviados.map((i) => i.shippedAt as Date).sort((a, b) => a.getTime() - b.getTime())[0]) : null,
    null,
  ];

  const wa = buildWhatsappLink(
    STORE_WHATSAPP_NUMBER,
    `Hola! Tengo una consulta sobre mi pedido ${nro(order.orderNumber)}.`
  );

  const Producto = ({ it }: { it: (typeof order.items)[number] }) => (
    <div className="sg-prod">
      <div className="sg-prod-img">
        {it.product.images[0]?.url && <img src={it.product.images[0].url} alt={it.productName} />}
      </div>
      <div style={{ minWidth: 0 }}>
        <p className="sg-label">{it.productBrand}</p>
        <p className="sg-prod-name">{it.productName}</p>
        <p className="sg-muted">Talle {it.size} · x{it.quantity}{it.isEncargo ? " · Por encargo" : ""}</p>
      </div>
    </div>
  );

  return (
    <div className="sg-wrap">
      <style>{CSS}</style>
      <div className="sg-inner">

        {/* Encabezado */}
        <p className="sg-label">Seguimiento de pedido · {nro(order.orderNumber)}</p>
        <h1 className="sg-title">{titulo}</h1>
        <p className="sg-sub">
          {order.guestFirstName ? `${order.guestFirstName}, ` : ""}{bajada.charAt(0).toLowerCase() + bajada.slice(1)}
        </p>

        {/* Linea de tiempo */}
        {!cancelado && (
          <div className="sg-card sg-steps-card">
            <div className="sg-steps">
              <div className="sg-rail"><div className="sg-rail-fill" style={{ ["--sg-p" as string]: Math.max(0, paso) / (PASOS.length - 1) }} /></div>
              {PASOS.map((p, i) => {
                const hecho = i < paso || (i === paso && order.status === "DELIVERED");
                const actual = i === paso && order.status !== "DELIVERED";
                return (
                  <div key={p} className={`sg-step ${hecho ? "is-done" : ""} ${actual ? "is-now" : ""}`}>
                    <span className="sg-dot">
                      {hecho && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      )}
                    </span>
                    <span className="sg-step-txt">
                      <span className="sg-step-name">{p}</span>
                      {fechasPaso[i] && (hecho || actual) && <span className="sg-step-date">{fechasPaso[i]}</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Envios despachados */}
        {[...envios.entries()].map(([tracking, items], idx) => (
          <div key={tracking} className="sg-card">
            <div className="sg-card-head">
              <p className="sg-label">{envios.size > 1 ? `Envío ${idx + 1} de ${envios.size}` : "Tu envío"} · Andreani</p>
              <p className="sg-muted">Despachado el {fecha(items[0].shippedAt as Date)}{destino ? ` · a ${destino}` : ""}</p>
            </div>
            <div className="sg-track">
              <div>
                <p className="sg-label">Número de seguimiento</p>
                <p className="sg-track-num">{tracking}</p>
              </div>
              <div className="sg-track-actions">
                <CopyPill value={tracking} />
                <a className="sg-btn" href={andreaniUrl(tracking)} target="_blank" rel="noopener noreferrer">
                  Seguir en Andreani
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7" /><path d="M8 7h9v9" /></svg>
                </a>
              </div>
            </div>
            <div className="sg-prods">{items.map((it) => <Producto key={it.id} it={it} />)}</div>
          </div>
        ))}

        {/* Lo que todavia no salio */}
        {pendientes.length > 0 && (
          <div className="sg-card">
            <div className="sg-card-head">
              <p className="sg-label">{enviados.length ? "Todavía por despachar" : "Tu pedido"}</p>
              {!cancelado && pendientes.some((i) => i.isEncargo) && (
                <p className="sg-muted">Los productos por encargo llegan en aprox. 14 días.</p>
              )}
            </div>
            <div className="sg-prods">{pendientes.map((it) => <Producto key={it.id} it={it} />)}</div>
          </div>
        )}

        {/* Ayuda */}
        <div className="sg-help">
          <p className="sg-muted">¿Alguna duda con tu pedido?</p>
          <div className="sg-help-actions">
            <a className="sg-btn sg-btn-ghost" href={wa} target="_blank" rel="noopener noreferrer">Escribinos por WhatsApp</a>
            <a className="sg-link" href={"/receipt/" + order.id}>Ver comprobante</a>
          </div>
        </div>

      </div>
    </div>
  );
}

// Estilos propios de la pagina (clases sg-*). Van aca y no en globals.css para que
// la pagina sea autocontenida. Los espacios se definen en estas clases a proposito:
// la regla global "* { margin:0; padding:0 }" anula las clases de espacio de Tailwind.
const CSS = `
.sg-wrap { background: #FAFAFA; min-height: 70vh; padding: 48px 16px 72px; }
.sg-inner { max-width: 720px; margin: 0 auto; }
.sg-label { font-family: var(--font-name, ui-monospace), ui-monospace, 'SF Mono', Menlo, monospace; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #737373; }
.sg-title { font-size: 40px; line-height: 1.05; font-weight: 600; letter-spacing: -0.03em; color: #0A0A0A; margin: 14px 0 12px; }
.sg-sub { font-size: 16px; line-height: 1.5; color: #525252; max-width: 520px; margin-bottom: 32px; }
.sg-muted { font-size: 13px; line-height: 1.45; color: #737373; }
.sg-card { background: #fff; border-radius: 20px; box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04); padding: 24px; margin-bottom: 16px; }
.sg-card-head { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }

/* Linea de tiempo */
.sg-steps-card { padding: 28px 24px; }
.sg-steps { position: relative; display: flex; justify-content: space-between; }
.sg-rail { position: absolute; left: 12%; right: 12%; top: 11px; height: 2px; background: #E8E8E8; border-radius: 2px; overflow: hidden; }
.sg-rail-fill { height: 100%; width: calc(var(--sg-p) * 100%); background: #0A0A0A; border-radius: 2px; transform-origin: left; animation: sg-grow 0.9s cubic-bezier(0.32,0.72,0,1) both; }
@keyframes sg-grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
.sg-step { position: relative; flex: 1; display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
.sg-dot { width: 24px; height: 24px; border-radius: 999px; background: #fff; border: 2px solid #D4D4D4; display: flex; align-items: center; justify-content: center; position: relative; z-index: 1; }
.sg-step.is-done .sg-dot { background: #0A0A0A; border-color: #0A0A0A; }
.sg-step.is-now .sg-dot { border-color: #0A0A0A; border-width: 7px; }
.sg-step.is-now .sg-dot::after { content: ""; position: absolute; inset: -11px; border-radius: 999px; border: 2px solid #0A0A0A; opacity: 0; animation: sg-pulse 1.8s ease-out infinite; }
@keyframes sg-pulse { 0% { transform: scale(0.6); opacity: 0.45; } 100% { transform: scale(1.25); opacity: 0; } }
.sg-step-txt { display: flex; flex-direction: column; gap: 3px; }
.sg-step-name { font-size: 13px; font-weight: 500; color: #A3A3A3; }
.sg-step.is-done .sg-step-name, .sg-step.is-now .sg-step-name { color: #0A0A0A; }
.sg-step.is-now .sg-step-name { font-weight: 600; }
.sg-step-date { font-size: 11px; color: #A3A3A3; }

/* Numero de seguimiento */
.sg-track { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; background: #F5F5F7; border-radius: 16px; padding: 20px; margin-bottom: 20px; }
.sg-track-num { font-family: var(--font-name, ui-monospace), ui-monospace, 'SF Mono', Menlo, monospace; font-size: 24px; letter-spacing: 0.04em; color: #0A0A0A; margin-top: 8px; word-break: break-all; }
.sg-track-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.sg-btn { display: inline-flex; align-items: center; gap: 8px; padding: 9px 18px; border-radius: 999px; background: #0A0A0A; color: #fff; font-size: 13px; font-weight: 500; text-decoration: none; transition: opacity 0.2s ease, transform 0.2s ease; white-space: nowrap; }
.sg-btn:hover { opacity: 0.85; }
.sg-btn:active { transform: scale(0.98); }
.sg-btn-ghost { background: #fff; color: #0A0A0A; border: 1px solid #D4D4D4; }

/* Productos */
.sg-prods { display: flex; flex-direction: column; gap: 14px; }
.sg-prod { display: flex; align-items: center; gap: 14px; }
.sg-prod-img { width: 56px; height: 70px; border-radius: 10px; background: #F4F4F4; overflow: hidden; flex-shrink: 0; }
.sg-prod-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
.sg-prod-name { font-family: var(--font-name, ui-monospace), ui-monospace, 'SF Mono', Menlo, monospace; font-size: 13px; letter-spacing: 0.05em; text-transform: uppercase; color: #0A0A0A; margin: 4px 0; }

/* Ayuda */
.sg-help { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; padding: 24px 8px 0; }
.sg-help-actions { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.sg-link { font-size: 13px; color: #0066CC; text-decoration: none; }
.sg-link:hover { text-decoration: underline; }

@media (max-width: 600px) {
  .sg-wrap { padding: 32px 14px 56px; }
  .sg-title { font-size: 32px; }
  .sg-card { padding: 20px; border-radius: 18px; }
  /* En el celular la linea de tiempo va vertical */
  .sg-steps { flex-direction: column; gap: 22px; }
  .sg-rail { left: 11px; right: auto; top: 12px; bottom: 12px; width: 2px; height: auto; }
  .sg-rail-fill { width: 100%; height: calc(var(--sg-p) * 100%); transform-origin: top; animation-name: sg-grow-y; }
  @keyframes sg-grow-y { from { transform: scaleY(0); } to { transform: scaleY(1); } }
  .sg-step { flex-direction: row; align-items: center; text-align: left; gap: 14px; }
  .sg-step-txt { flex-direction: row; align-items: baseline; gap: 8px; }
  .sg-step-name { font-size: 15px; }
  .sg-track { align-items: flex-start; flex-direction: column; }
  .sg-track-num { font-size: 21px; }
  .sg-track-actions { width: 100%; }
  .sg-track-actions .sg-btn { flex: 1; justify-content: center; }
  .sg-help { flex-direction: column; align-items: flex-start; }
}
@media (prefers-reduced-motion: reduce) {
  .sg-rail-fill, .sg-step.is-now .sg-dot::after { animation: none; }
}
`;
