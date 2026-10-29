// "Armá mi semana": el plan que haria un community manager para una semana
// (lunes a domingo): 4 posts y 7 historias (una por dia), con productos
// reales y sin repetir. Este archivo SOLO planifica (no usa IA ni crea nada):
// el panel despues arma cada pieza de a una con /api/admin/social/drafts y
// quedan como borradores con fecha = "propuestas para aprobar".
import { prisma } from "@/lib/prisma";
import { getSuggestions } from "./suggestions";
import type { PostTag } from "./postImage";
import { enTemporada } from "@/lib/storeInfo";

export type PlanSlot = {
  key: string;
  when: string; // ISO
  format: "post" | "story";
  kind: string;
  title: string;
  description: string;
  productIds?: string[];
  tag?: PostTag | null;
  presetId?: string;
};

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
// Dia (0 = lunes) y hora de Argentina. Horarios en que mas se mira Instagram.
const POST_SLOTS = [{ d: 0, h: 20 }, { d: 2, h: 20 }, { d: 4, h: 13 }, { d: 6, h: 20 }];
const STORY_HOUR = 12;
export const WEEK_GOAL = { posts: POST_SLOTS.length, stories: 7 };
const COUNTED = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

const inStock = {
  deletedAt: null,
  isActive: true,
  images: { some: {} },
  variants: { some: { stock: { gt: 0 } } },
};

// weekStart = lunes 00:00 hora de Argentina (lo manda el panel).
export async function planWeek(weekStart: Date, exclude: string[] = []): Promise<PlanSlot[]> {
  const weekEnd = new Date(+weekStart + 7 * DAY);
  const minTime = Date.now() + 30 * 60_000;

  // Lo que ya hay en esa semana (propuestas, agendados, publicados).
  const existing = await prisma.scheduledPost.findMany({
    where: {
      OR: [
        { status: { in: ["draft", "approved", "publishing", "paused", "failed"] }, scheduledAt: { gte: weekStart, lt: weekEnd } },
        { status: "published", publishedAt: { gte: weekStart, lt: weekEnd } },
      ],
    },
    select: { mediaType: true, productIds: true, scheduledAt: true, publishedAt: true, status: true },
  });
  const dayOf = (d: Date) => Math.floor((+d - +weekStart) / DAY);
  const storyDays = new Set<number>();
  const postDays = new Set<number>();
  for (const p of existing) {
    const at = (p.status === "published" ? p.publishedAt : p.scheduledAt) as Date;
    (p.mediaType === "story" ? storyDays : postDays).add(dayOf(at));
  }
  const postsLeft = Math.max(0, WEEK_GOAL.posts - existing.filter((p) => p.mediaType !== "story").length);

  // Huecos libres (dias sin post / sin historia, en el futuro).
  const postSlots = POST_SLOTS.map((s) => ({ d: s.d, at: new Date(+weekStart + s.d * DAY + s.h * HOUR) }))
    .filter((s) => !postDays.has(s.d) && +s.at > minTime)
    .slice(0, postsLeft);
  const storySlots = Array.from({ length: 7 }, (_, d) => ({ d, at: new Date(+weekStart + d * DAY + STORY_HOUR * HOUR) }))
    .filter((s) => !storyDays.has(s.d) && +s.at > minTime);
  if (!postSlots.length && !storySlots.length) return [];

  // Productos que no se repiten: los de esta semana, lo publicado/agendado
  // en los ultimos 30 dias y lo que Tommy descarto.
  const recent = await prisma.scheduledPost.findMany({
    where: {
      OR: [
        { status: { in: ["approved", "publishing"] } },
        { status: "published", publishedAt: { gte: new Date(Date.now() - 30 * DAY) } },
      ],
    },
    select: { productIds: true },
  });
  const used = new Set<string>([...existing.flatMap((p) => p.productIds), ...recent.flatMap((p) => p.productIds), ...exclude]);
  const take = (ids: string[] | undefined) => (ids || []).filter((id) => !used.has(id));
  const mark = (ids: string[]) => ids.forEach((id) => used.add(id));

  const suggestions = await getSuggestions();

  // Lo mas vendido (60 dias) con stock, y el resto del catalogo con stock.
  const top = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: { order: { status: { in: [...COUNTED] }, createdAt: { gte: new Date(Date.now() - 60 * DAY) } } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 40,
  });
  const topIds = top.map((t) => t.productId);
  const [topInStock, catalog] = await Promise.all([
    prisma.product.findMany({ where: { ...inStock, id: { in: topIds } }, select: { id: true, name: true } }),
    prisma.product.findMany({ where: inStock, select: { id: true, name: true }, orderBy: { createdAt: "desc" }, take: 80 }),
  ]);
  const names = new Map([...topInStock, ...catalog].map((p) => [p.id, p.name]));
  const bestSellers = topIds.filter((id) => topInStock.some((p) => p.id === id));
  // Mezcla el catalogo para que cada semana no salgan siempre los mismos.
  const seed = Math.floor(+weekStart / DAY);
  const rest = catalog.map((p, i) => ({ id: p.id, r: Math.sin(seed * 31 + i * 17) })).sort((a, b) => a.r - b.r).map((p) => p.id);
  const pool = () => [...bestSellers, ...rest].filter((id) => !used.has(id));

  // ---------- Posts ----------
  type Cand = Omit<PlanSlot, "key" | "when">;
  const posts: Cand[] = [];
  for (const s of suggestions.filter((x) => x.format === "post")) {
    const ids = take(s.productIds);
    if (!ids.length) continue;
    posts.push({ format: "post", kind: s.kind, title: s.title, description: s.description, productIds: ids, tag: s.tag ?? null });
    mark(ids);
  }
  const best = bestSellers.filter((id) => !used.has(id)).slice(0, 5);
  if (best.length >= 3) {
    posts.push({ format: "post", kind: "masvendidos", title: `Lo más vendido (${best.length})`, description: "Carrusel con lo que más se vendió en los últimos 2 meses y tiene stock.", productIds: best, tag: null });
    mark(best);
  }
  while (posts.length < postSlots.length) {
    const id = pool()[0];
    if (!id) break;
    posts.push({ format: "post", kind: "destacado", title: `Destacado: ${names.get(id) || "producto"}`, description: "Producto con stock que no mostraste en el último mes.", productIds: [id], tag: null });
    mark([id]);
  }

  // ---------- Historias ----------
  const urgent: Cand[] = [];
  for (const s of suggestions.filter((x) => x.format === "story")) {
    if (s.presetId) { urgent.push({ format: "story", kind: s.kind, title: s.title, description: s.description, presetId: s.presetId }); continue; }
    const ids = take(s.productIds).slice(0, 1);
    if (!ids.length) continue;
    urgent.push({ format: "story", kind: s.kind, title: s.title, description: s.description, productIds: ids, tag: s.tag ?? null });
    mark(ids);
  }
  // Historias de marca (plantillas de Canva): 2 por semana, rotando.
  const brand: Cand[] = [
    { format: "story", kind: "horarios", title: "Horarios del local", description: "Los horarios de Pinamar, con tu plantilla de Canva.", presetId: enTemporada() ? "temporada" : "fuera" },
    { format: "story", kind: "local", title: "Visitanos", description: "Dirección, horario y teléfono del local en Pinamar.", presetId: "contacto" },
    { format: "story", kind: "envios", title: "Tiempos de envío", description: "CABA, interior y encargos, con envío gratis desde $180.000.", presetId: "envios" },
  ].filter((b) => !urgent.some((u) => u.presetId === b.presetId)) as Cand[];
  const r0 = Math.floor(+weekStart / (7 * DAY)) % brand.length;
  const presets: Cand[] = [brand[r0], brand[(r0 + 1) % brand.length]].filter(Boolean);
  // Miercoles y sabado: historia de marca (asi al descartarla y "Completar"
  // se vuelve a armar ese mismo dia). El resto: urgentes y productos.
  const BRAND_DAYS = [2, 5];
  const brandQ: Cand[] = [...urgent.filter((u) => u.presetId), ...presets];
  const productQ: Cand[] = urgent.filter((u) => !u.presetId);
  const nextProduct = (): Cand | undefined => {
    const q = productQ.shift();
    if (q) return q;
    const id = pool()[0];
    if (!id) return undefined;
    mark([id]);
    return { format: "story", kind: "producto", title: names.get(id) || "Producto", description: "Historia con el producto, foto real y precio.", productIds: [id], tag: null };
  };
  const stories: (Cand | undefined)[] = storySlots.map((sl) =>
    BRAND_DAYS.includes(sl.d) && brandQ.length ? brandQ.shift() : nextProduct() || brandQ.shift()
  );

  const out: PlanSlot[] = [];
  postSlots.forEach((s, i) => { if (posts[i]) out.push({ ...posts[i], key: `post-${s.d}`, when: s.at.toISOString() }); });
  storySlots.forEach((s, i) => { if (stories[i]) out.push({ ...stories[i], key: `story-${s.d}`, when: s.at.toISOString() }); });
  return out.sort((a, b) => +new Date(a.when) - +new Date(b.when));
}
