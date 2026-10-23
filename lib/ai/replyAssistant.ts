// Sugiere la respuesta a un mensaje de Instagram/WhatsApp usando SOLO
// datos reales: productos con stock y precio, estado de pedido (solo si
// coinciden numero Y mail), y los datos del local. Si no sabe, lo dice y
// marca la conversacion para que responda Tommy. Nunca envia: devuelve un
// borrador.
import { prisma } from "@/lib/prisma";
import { callModel, AiError } from "./client";
import { getBrandVoice } from "./brandVoice";
import { STORE_INFO } from "@/lib/storeInfo";
import { SHIPPING_COST, FREE_SHIPPING_THRESHOLD } from "@/lib/shipping";
import { TRANSFER_DISCOUNT_PERCENT, TRANSFER_DISCOUNT_MIN_PRICE } from "@/lib/bankDetails";

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
const STOP = new Set(["hola", "buenas", "buen", "dia", "tardes", "noches", "tenes", "tienen", "quiero", "precio", "precios", "talle", "talles", "numero", "cuanto", "sale", "salen", "esta", "estan", "para", "como", "hay", "algun", "alguna", "unas", "unos", "las", "los", "del", "que", "con", "por", "favor", "gracias", "envio", "envios", "zapatillas", "zapas", "zapatilla", "mujer", "mujeres", "dama", "hombre", "hombres", "nene", "nena", "nino", "nina", "chicos", "menos", "hasta", "maximo", "lucas", "mil", "algo", "busco", "buscando", "stock", "disponible", "color"]);

// Lo que pide el cliente, leido del texto: talle, genero y precio maximo.
function parseFilters(raw: string) {
  const t = raw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const size =
    t.match(/\b(?:talle|numero|nro|n°)\s*(\d{2}(?:[.,]5)?|xxs|xs|s|m|l|xl|xxl|xxxl)\b/)?.[1] ??
    t.match(/\b(3[4-9]|4[0-7])(?:[.,]5)?\b/)?.[0] ??
    null;
  const gender = /\b(mujer|mujeres|dama|femenin)/.test(t) ? "MUJER" : /\b(hombre|hombres|caballero|masculin)/.test(t) ? "HOMBRE" : /\b(nene|nena|nino|nina|chicos|kids)\b/.test(t) ? "NINO" : null;
  const pm = t.match(/(?:menos de|hasta|max(?:imo)?|no mas de)\s*\$?\s*([\d.]+)\s*(k|lucas|mil)?/);
  let maxPrice: number | null = null;
  if (pm) {
    const n = Number(pm[1].replace(/\./g, ""));
    maxPrice = pm[2] || n < 1000 ? n * 1000 : n;
  }
  return { size: size ? size.toUpperCase().replace(",", ".") : null, gender, maxPrice };
}

const RETIRO: Record<string, string> = {
  PINAMAR: "retiro en el local de Pinamar (Av. Constitución 270)",
  CABA: "retiro en CABA (Av. Callao 1371, Recoleta)",
  AMBOS: "retiro en Pinamar (Av. Constitución 270) o en CABA (Av. Callao 1371, Recoleta)",
};

const productSelect = {
  name: true,
  slug: true,
  colorName: true,
  groupSlug: true,
  categoryId: true,
  price: true,
  salePrice: true,
  saleEndsAt: true,
  isEncargo: true,
  pickupLocation: true,
  gender: true,
  brand: { select: { name: true } },
  category: { select: { name: true } },
  variants: { where: { stock: { gt: 0 } }, select: { size: true }, orderBy: { sortOrder: "asc" as const } },
};

type Row = Awaited<ReturnType<typeof loadProducts>>[number];
function loadProducts(where: object, take: number) {
  return prisma.product.findMany({ where: { deletedAt: null, isActive: true, ...where }, select: productSelect, take });
}

function shape(p: Row, size: string | null) {
  const sale = p.salePrice != null && (!p.saleEndsAt || p.saleEndsAt > new Date());
  const precioFinal = sale ? Number(p.salePrice) : Number(p.price);
  const talles = p.variants.map((v) => v.size);
  const tieneTalle = size ? talles.some((x) => x.toUpperCase() === size) : undefined;
  const params = new URLSearchParams({ utm_source: "instagram", utm_medium: "dm" });
  if (size && tieneTalle) params.set("talle", size);
  return {
    producto: p.name,
    marca: p.brand.name,
    categoria: p.category.name,
    color: p.colorName || undefined,
    precio: money(Number(p.price)),
    precioOferta: sale ? money(Number(p.salePrice)) : undefined,
    precioConTransferencia:
      precioFinal > TRANSFER_DISCOUNT_MIN_PRICE ? money(precioFinal * (1 - TRANSFER_DISCOUNT_PERCENT / 100)) : undefined,
    tallesConStock: talles,
    tieneElTallePedido: tieneTalle,
    sinStock: talles.length === 0 && !p.isEncargo,
    esEncargo: p.isEncargo || undefined,
    retiro: RETIRO[p.pickupLocation] || RETIRO.PINAMAR,
    link: `${SITE_URL}/product/${p.slug}?${params.toString()}`,
  };
}

async function findProducts(text: string) {
  const f = parseFilters(text);
  const words = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !STOP.has(w) && !/^\d+$/.test(w))
    .slice(0, 8);

  const filters: object[] = [];
  if (f.gender) filters.push({ gender: { in: [f.gender, "UNISEX"] } });
  if (f.maxPrice) filters.push({ price: { lte: f.maxPrice } });
  if (!words.length && !filters.length) return { pedido: f, productos: [], alternativas: [] };

  const textMatch = words.length
    ? {
        OR: words.flatMap((w) => [
          { name: { contains: w, mode: "insensitive" as const } },
          { brand: { name: { contains: w, mode: "insensitive" as const } } },
          { colorName: { contains: w, mode: "insensitive" as const } },
          { category: { name: { contains: w, mode: "insensitive" as const } } },
        ]),
      }
    : {};
  const found = await loadProducts({ AND: [textMatch, ...filters] }, 40);
  const score = (p: Row) => {
    const hay = `${p.name} ${p.brand.name} ${p.colorName || ""} ${p.category.name}`.toLowerCase();
    let sc = words.filter((w) => hay.includes(w)).length * 10;
    if (f.size && p.variants.some((v) => v.size.toUpperCase() === f.size)) sc += 5;
    if (p.variants.length) sc += 1;
    return sc;
  };
  const top = found.sort((a, b) => score(b) - score(a)).slice(0, 8);

  // Alternativas: si pidio un talle que no hay en lo encontrado, el mismo
  // modelo en otros colores o productos de la misma categoria con ese talle.
  let alternativas: Row[] = [];
  if (f.size && top.length && !top.some((p) => p.variants.some((v) => v.size.toUpperCase() === f.size))) {
    const groups = top.map((p) => p.groupSlug).filter(Boolean) as string[];
    const cats = [...new Set(top.map((p) => p.categoryId))];
    alternativas = await loadProducts(
      {
        slug: { notIn: top.map((p) => p.slug) },
        variants: { some: { stock: { gt: 0 }, size: { equals: f.size, mode: "insensitive" } } },
        OR: [...(groups.length ? [{ groupSlug: { in: groups } }] : []), { categoryId: { in: cats } }],
        ...(f.gender ? { gender: { in: [f.gender, "UNISEX"] } } : {}),
      },
      4,
    );
  }
  return { pedido: f, productos: top.map((p) => shape(p, f.size)), alternativas: alternativas.map((p) => shape(p, f.size)) };
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
      "REGLAS: usá SOLO los datos que te paso (productos, pedido, datos del local). Nunca inventes stock, talles, precios, costos o plazos de envío, descuentos ni políticas. El costo de envío es SOLO el que figura en 'Envíos'; no pidas código postal para cotizar. Si no encontrás el producto o falta un dato, decí que lo chequeás y marcá needsHuman=true. Si el cliente solo PREGUNTA cómo son los cambios o devoluciones, respondé con la 'Política de cambios y devoluciones' (category=politica) y no agregues condiciones que no estén ahí. Si quiere HACER un cambio o devolución concreto, reclamos, problemas de pago o enojo: needsHuman=true. Nunca des datos de un pedido si no está verificado.",
      "CÓMO VENDER: si hay el talle que pide, decilo claro con el precio. Si no hay ese talle, decilo y ofrecé las 'alternativas' (mismo modelo en otro color o algo parecido con su talle). Si un producto esEncargo, aclará que es por encargo y que te confirmamos disponibilidad, sin dar plazos. Mencioná el retiro sin cargo cuando aplique (campo retiro). Cuando el precio lo justifique, mencioná el precioConTransferencia y las cuotas sin interés de 'Promos'. No mandes más de 3 productos. Si hay muchos, preguntá talle o color para afinar. No repitas el saludo si la conversación ya empezó.",
    ]
      .filter(Boolean)
      .join("\n"),
    user: [
      "Conversación (más vieja primero):",
      history.map((m) => `${m.direction === "in" ? "CLIENTE" : "TIENDA"}: ${m.text || "[adjunto]"}`).join("\n"),
      "Lo que pide el cliente (talle, género, precio máximo detectados): " + JSON.stringify(products.pedido),
      "Productos encontrados en la tienda (JSON):",
      JSON.stringify(products.productos),
      "Alternativas con el talle pedido (JSON):",
      JSON.stringify(products.alternativas),
      "Pedido: " + JSON.stringify(order),
      "Datos del local: " + JSON.stringify(STORE_INFO),
      "Promos vigentes (las mismas de la barra de la web): " +
        JSON.stringify({
          transferencia: `${TRANSFER_DISCOUNT_PERCENT}% OFF pagando por transferencia en productos de más de ${money(TRANSFER_DISCOUNT_MIN_PRICE)}`,
          cuotas: "hasta 3 cuotas sin interés con Visa, Mastercard y Amex",
          envioGratis: "envío gratis en compras desde " + money(FREE_SHIPPING_THRESHOLD),
        }),
      "Política de cambios y devoluciones: " +
        JSON.stringify({ plazo: "hasta 10 días", condicion: "el producto tiene que estar sin uso y con etiqueta", envio: "el costo del envío del cambio o la devolución lo paga el cliente", gestion: "para hacerlo, lo coordina una persona del equipo" }),
      "Puntos de retiro: Pinamar (Av. Constitución 270) y CABA (Av. Callao 1371, Recoleta); cada producto dice dónde se puede retirar.",
      "Envíos (los mismos que cobra la web en el checkout): " +
        JSON.stringify({
          costo: money(SHIPPING_COST) + " a cualquier punto del país, mismo precio para CABA y para el interior",
          envioGratis: "en compras desde " + money(FREE_SHIPPING_THRESHOLD),
          plazo: "NO LO SABÉS: no des días ni fechas; decí que se lo confirmamos al despachar",
        }),
      'Respondé SOLO JSON: {"reply": "mensaje listo para enviar, máximo 600 caracteres, SIN links (los links van aparte)", "links": ["link exacto (campo link) de cada producto que recomendás, máximo 3"], "needsHuman": true|false, "reason": "por qué necesita a Tommy, o vacío", "category": "stock|precio|horarios|envios|politica|pedido|cambio|reclamo|otro"}',
    ].join("\n\n"),
    maxTokens: 600,
  });

  const gen = await prisma.aiGeneration.create({
    data: {
      kind: "reply",
      input: { conversationId, products: products.productos.length, alternativas: products.alternativas.length, order: !!order.pedido },
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
    // Links aparte: cada uno se manda solo, asi Instagram arma la tarjeta con
    // la imagen del producto. Solo se aceptan links de productos encontrados.
    const valid = new Set([...products.productos, ...products.alternativas].map((p) => p.link));
    const links = (Array.isArray(j.links) ? j.links : []).map(String).filter((l: string) => valid.has(l)).slice(0, 3);
    const reply = String(j.reply || "")
      .replace(/https?:\/\/\S*memberclubargentina\.com\/product\/\S+/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    return {
      generationId: gen.id,
      reply,
      links,
      needsHuman: !!j.needsHuman,
      reason: String(j.reason || ""),
      category: String(j.category || "otro"),
      sources: { productos: [...products.productos, ...products.alternativas].map((p) => p.producto), pedidoVerificado: !!order.pedido },
    };
  } catch {
    throw new AiError("La IA no devolvió un formato válido. Probá de nuevo.", 502);
  }
}
