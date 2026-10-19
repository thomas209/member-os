// Sugiere la respuesta a un mensaje de Instagram/WhatsApp usando SOLO
// datos reales: productos con stock y precio, estado de pedido (solo si
// coinciden numero Y mail), y los datos del local. Si no sabe, lo dice y
// marca la conversacion para que responda Tommy. Nunca envia: devuelve un
// borrador.
import { prisma } from "@/lib/prisma";
import { callModel, AiError } from "./client";
import { getBrandVoice } from "./brandVoice";
import { STORE_INFO } from "@/lib/storeInfo";

const SITE_URL = process.env.NEXT_PUBLIC_URL || "https://www.memberclubargentina.com";
const money = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");
const STATUS: Record<string, string> = {
  PENDING: "pendiente de pago",
  PAID: "pagado, en preparación",
  PROCESSING: "en preparación",
  SHIPPED: "enviado",
  DELIVERED: "entregado",
  CANCELLED: "cancelado",
  REFUNDED: "reintegrado",
};
const STOP = new Set(["hola", "buenas", "tenes", "tienen", "quiero", "precio", "talle", "talles", "cuanto", "sale", "esta", "estan", "para", "como", "hay", "algun", "alguna", "unas", "unos", "las", "los", "del", "que", "con", "por", "favor", "gracias", "envio", "envios", "zapatillas", "zapas"]);

async function findProducts(text: string) {
  const words = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !STOP.has(w))
    .slice(0, 8);
  if (!words.length) return [];
  const products = await prisma.product.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      OR: words.flatMap((w) => [
        { name: { contains: w, mode: "insensitive" as const } },
        { brand: { name: { contains: w, mode: "insensitive" as const } } },
        { colorName: { contains: w, mode: "insensitive" as const } },
      ]),
    },
    select: {
      name: true,
      slug: true,
      colorName: true,
      price: true,
      salePrice: true,
      saleEndsAt: true,
      isEncargo: true,
      brand: { select: { name: true } },
      variants: { where: { stock: { gt: 0 } }, select: { size: true }, orderBy: { sortOrder: "asc" } },
    },
    take: 30,
  });
  // Los que matchean mas palabras primero.
  const score = (p: (typeof products)[number]) =>
    words.filter((w) => `${p.name} ${p.brand.name} ${p.colorName || ""}`.toLowerCase().includes(w)).length;
  return products
    .sort((a, b) => score(b) - score(a))
    .slice(0, 8)
    .map((p) => {
      const sale = p.salePrice != null && (!p.saleEndsAt || p.saleEndsAt > new Date());
      return {
        producto: p.name,
        marca: p.brand.name,
        color: p.colorName || undefined,
        precio: money(Number(p.price)),
        precioOferta: sale ? money(Number(p.salePrice)) : undefined,
        tallesConStock: p.variants.map((v) => v.size),
        sinStock: p.variants.length === 0,
        esEncargo: p.isEncargo,
        link: `${SITE_URL}/product/${p.slug}`,
      };
    });
}

// Estado de pedido SOLO si el cliente da numero de pedido y el mail con el
// que compro, y coinciden. Si no, no se revela nada.
async function findOrder(text: string) {
  const num = text.match(/(?:pedido|orden|compra|n[°ºo]\.?|#)\s*#?\s*(\d{2,7})/i)?.[1];
  const email = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0]?.toLowerCase();
  if (!num) return { pedido: null, nota: "El cliente no dio número de pedido." };
  if (!email) return { pedido: null, nota: `Dio el número ${num} pero no el mail de la compra: pedile el mail para confirmar.` };
  const o = await prisma.order.findFirst({
    where: { orderNumber: Number(num) },
    select: { orderNumber: true, status: true, guestEmail: true, customer: { select: { email: true } }, trackingNumber: true, shippingMethod: true },
  });
  const orderEmail = (o?.guestEmail || o?.customer?.email || "").toLowerCase();
  if (!o || orderEmail !== email) return { pedido: null, nota: "El número y el mail no coinciden con ningún pedido. No des información del pedido." };
  return {
    pedido: { numero: o.orderNumber, estado: STATUS[o.status] || o.status, envio: o.shippingMethod || undefined, seguimiento: o.trackingNumber || undefined },
    nota: "Pedido verificado (número y mail coinciden).",
  };
}

export async function suggestReply(conversationId: string) {
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { messages: { orderBy: { sentAt: "desc" }, take: 12 } },
  });
  if (!conv) throw new AiError("Conversación no encontrada", 404);
  const history = [...conv.messages].reverse();
  const lastIn = history.filter((m) => m.direction === "in").slice(-3).map((m) => m.text || "").join("\n");
  if (!lastIn.trim()) throw new AiError("No hay mensajes del cliente para responder", 400);

  const [products, order, voice] = await Promise.all([findProducts(lastIn), findOrder(history.map((m) => m.text || "").join("\n")), getBrandVoice()]);

  const r = await callModel({
    system: [
      "Respondés mensajes directos de clientes de Member Club, tienda de sneakers y streetwear premium de Pinamar, Argentina. Español rioplatense, tuteando con 'vos', corto y cálido, como escribe la tienda.",
      voice?.tone ? "Tono de la marca: " + voice.tone : "",
      "REGLAS: usá SOLO los datos que te paso (productos, pedido, datos del local). Nunca inventes stock, talles, precios, plazos de entrega, descuentos ni políticas. Si no encontrás el producto o falta un dato, decí que lo chequeás y marcá needsHuman=true. Reclamos, cambios, devoluciones, problemas de pago o enojo: needsHuman=true. Nunca des datos de un pedido si no está verificado.",
    ]
      .filter(Boolean)
      .join("\n"),
    user: [
      "Conversación (más vieja primero):",
      history.map((m) => `${m.direction === "in" ? "CLIENTE" : "TIENDA"}: ${m.text || "[adjunto]"}`).join("\n"),
      "Productos encontrados en la tienda para lo que pregunta (JSON):",
      JSON.stringify(products),
      "Pedido: " + JSON.stringify(order),
      "Datos del local: " + JSON.stringify(STORE_INFO),
      'Respondé SOLO JSON: {"reply": "mensaje listo para enviar, máximo 600 caracteres", "needsHuman": true|false, "reason": "por qué necesita a Tommy, o vacío", "category": "stock|precio|horarios|envios|pedido|cambio|reclamo|otro"}',
    ].join("\n\n"),
    maxTokens: 600,
  });

  const gen = await prisma.aiGeneration.create({
    data: {
      kind: "reply",
      input: { conversationId, products: products.length, order: !!order.pedido },
      output: r.text,
      model: r.model,
      inputTokens: r.inputTokens,
      outputTokens: r.outputTokens,
      costUsd: r.costUsd,
    },
  });
  try {
    const t = r.text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
    const j = JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1));
    return {
      generationId: gen.id,
      reply: String(j.reply || ""),
      needsHuman: !!j.needsHuman,
      reason: String(j.reason || ""),
      category: String(j.category || "otro"),
      sources: { productos: products.map((p) => p.producto), pedidoVerificado: !!order.pedido },
    };
  } catch {
    throw new AiError("La IA no devolvió un formato válido. Probá de nuevo.", 502);
  }
}
