// "Para hoy": lo que un community manager te propondria publicar, sacado de
// datos reales de la tienda. No usa IA: son reglas sobre la base.
import { prisma } from "@/lib/prisma";
import { STORE_INFO } from "@/lib/storeInfo";

export type Suggestion = {
  id: string;
  kind: "nuevos" | "nuevo" | "restock" | "oferta" | "ultimos" | "frecuencia" | "horarios";
  title: string;
  description: string;
  productIds?: string[];
  tag?: "NEW IN" | "RESTOCK" | "SALE" | "ULTIMOS TALLES";
  format?: "post" | "story";
  presetId?: string;
  priority: number;
};

const DAY = 24 * 60 * 60 * 1000;

function parseDM(dm: string, year: number) {
  const [d, m] = dm.split("/").map(Number);
  return new Date(year, m - 1, d);
}

export async function getSuggestions(): Promise<Suggestion[]> {
  const now = new Date();
  const out: Suggestion[] = [];

  // Productos ya publicados o agendados en los ultimos 30 dias: no se repiten.
  const recentPosts = await prisma.scheduledPost.findMany({
    where: {
      OR: [
        { status: { in: ["approved", "publishing"] } },
        { status: "published", publishedAt: { gte: new Date(+now - 30 * DAY) } },
      ],
    },
    select: { productIds: true },
  });
  const posted = new Set(recentPosts.flatMap((p) => p.productIds));

  const base = {
    deletedAt: null,
    isActive: true,
    images: { some: {} },
    variants: { some: { stock: { gt: 0 } } },
  };
  const sel = { id: true, name: true, createdAt: true, salePrice: true, saleEndsAt: true, brand: { select: { name: true } }, variants: { select: { stock: true } } };

  // 1. Nuevos ingresos (ultimos 14 dias)
  const nuevos = (await prisma.product.findMany({ where: { ...base, createdAt: { gte: new Date(+now - 14 * DAY) } }, select: sel, orderBy: { createdAt: "desc" }, take: 20 })).filter((p) => !posted.has(p.id));
  if (nuevos.length >= 3) {
    out.push({
      id: "nuevos",
      kind: "nuevos",
      title: `Carrusel de nuevos ingresos (${Math.min(nuevos.length, 6)})`,
      description: `Entraron ${nuevos.length} productos en las últimas 2 semanas que todavía no mostraste: ${nuevos.slice(0, 3).map((p) => p.name).join(", ")}${nuevos.length > 3 ? "…" : ""}`,
      productIds: nuevos.slice(0, 6).map((p) => p.id),
      tag: "NEW IN",
      format: "post",
      priority: 90,
    });
  } else {
    for (const p of nuevos) {
      out.push({ id: "nuevo-" + p.id, kind: "nuevo", title: `Nuevo: ${p.name}`, description: `Entró el ${p.createdAt.toLocaleDateString("es-AR")} y todavía no lo publicaste.`, productIds: [p.id], tag: "NEW IN", format: "post", priority: 85 });
    }
  }

  // 2. Volvieron a tener stock (restock en los ultimos 10 dias, desde 0)
  const restocks = await prisma.stockMovement.findMany({
    where: { type: "RESTOCK", previousStock: 0, newStock: { gt: 0 }, createdAt: { gte: new Date(+now - 10 * DAY) } },
    select: { variant: { select: { productId: true, size: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const restockIds = [...new Set(restocks.map((r) => r.variant.productId))].filter((id) => !posted.has(id) && !nuevos.some((n) => n.id === id));
  if (restockIds.length) {
    const prods = await prisma.product.findMany({ where: { ...base, id: { in: restockIds } }, select: sel, take: 4 });
    for (const p of prods) {
      out.push({ id: "restock-" + p.id, kind: "restock", title: `Volvió: ${p.name}`, description: "Se repuso stock de talles que estaban agotados. Historia rápida para avisar.", productIds: [p.id], tag: "RESTOCK", format: "story", priority: 80 });
    }
  }

  // 3. Ofertas activas sin publicar
  const ofertas = (
    await prisma.product.findMany({
      where: { ...base, salePrice: { not: null }, OR: [{ saleEndsAt: null }, { saleEndsAt: { gt: now } }] },
      select: sel,
      take: 10,
    })
  ).filter((p) => !posted.has(p.id));
  if (ofertas.length) {
    const top = ofertas.slice(0, 4);
    out.push({
      id: "ofertas",
      kind: "oferta",
      title: top.length > 1 ? `Ofertas activas (${ofertas.length})` : `Oferta: ${top[0].name}`,
      description: `Tenés ${ofertas.length} producto${ofertas.length > 1 ? "s" : ""} con precio rebajado que no se mostraron en redes.`,
      productIds: top.map((p) => p.id),
      tag: "SALE",
      format: "post",
      priority: 75,
    });
  }

  // 4. Ultimos talles (1 a 3 unidades en total)
  const conPoco = (await prisma.product.findMany({ where: base, select: sel, take: 300 }))
    .map((p) => ({ ...p, total: p.variants.reduce((a, v) => a + Math.max(v.stock, 0), 0) }))
    .filter((p) => p.total > 0 && p.total <= 3 && !posted.has(p.id))
    .slice(0, 3);
  for (const p of conPoco) {
    out.push({ id: "ultimos-" + p.id, kind: "ultimos", title: `Últimos talles: ${p.name}`, description: `Quedan ${p.total} unidad${p.total > 1 ? "es" : ""}. Una historia ayuda a que se vaya.`, productIds: [p.id], tag: "ULTIMOS TALLES", format: "story", priority: 60 });
  }

  // 5. Frecuencia: hace cuanto no se publica desde Member OS
  const last = await prisma.scheduledPost.findFirst({ where: { status: "published" }, orderBy: { publishedAt: "desc" }, select: { publishedAt: true } });
  const days = last?.publishedAt ? Math.floor((+now - +last.publishedAt) / DAY) : null;
  if (days === null || days >= 3) {
    out.push({
      id: "frecuencia",
      kind: "frecuencia",
      title: days === null ? "Todavía no publicaste desde acá" : `Hace ${days} días que no publicás`,
      description: "Las cuentas que publican seguido aparecen más. Elegí cualquiera de las sugerencias y en 1 minuto queda listo.",
      priority: 10,
    });
  }

  // 6. Cambio de horarios por temporada (aviso 10 dias antes)
  const y = now.getFullYear();
  const start = parseDM(STORE_INFO.temporada.desde, y);
  const end = parseDM(STORE_INFO.temporada.hasta, now.getMonth() >= 6 ? y + 1 : y);
  const near = (d: Date) => +d - +now > -DAY && +d - +now < 10 * DAY;
  if (near(start)) out.push({ id: "horarios-temporada", kind: "horarios", title: "Arranca la temporada: avisá los horarios", description: `Desde el ${STORE_INFO.temporada.desde} el local abre ${STORE_INFO.temporada.dias.toLowerCase()} de ${STORE_INFO.temporada.horario}.`, presetId: "temporada", format: "story", priority: 95 });
  if (near(end)) out.push({ id: "horarios-fuera", kind: "horarios", title: "Termina la temporada: avisá los horarios nuevos", description: `Después del ${STORE_INFO.temporada.hasta}: ${STORE_INFO.restoDelAnio.dias.toLowerCase()}, ${STORE_INFO.restoDelAnio.horario}.`, presetId: "fuera", format: "story", priority: 95 });

  return out.sort((a, b) => b.priority - a.priority);
}
