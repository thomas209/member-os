// Publicacion en Instagram (API oficial, Instagram Login).
// Flujo: crear contenedor(es) -> esperar que Instagram procese -> publicar.
// Antes de publicar: el post tiene que estar aprobado y los productos con stock.
import { prisma } from "@/lib/prisma";
import { decryptToken } from "./crypto";
import { InstagramError, markReauth } from "./instagram";

const GRAPH = "https://graph.instagram.com";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function igPost(path: string, token: string, params: Record<string, string>) {
  const res = await fetch(GRAPH + path, { method: "POST", body: new URLSearchParams({ ...params, access_token: token }) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    const err = data.error || {};
    console.error("[instagram] publish", path, res.status, err.code, err.message);
    throw new InstagramError("Instagram: " + (err.error_user_msg || err.message || res.status), err.code === 190 ? 401 : 502, err.code === 190);
  }
  return data as { id: string };
}

async function igGet<T>(path: string, token: string, fields: string) {
  const u = new URL(GRAPH + path);
  u.searchParams.set("fields", fields);
  u.searchParams.set("access_token", token);
  const res = await fetch(u, { cache: "no-store" });
  return (await res.json()) as T;
}

async function waitReady(containerId: string, token: string) {
  for (let i = 0; i < 20; i++) {
    const s = await igGet<{ status_code?: string }>(`/${containerId}`, token, "status_code");
    if (s.status_code === "FINISHED") return;
    if (s.status_code === "ERROR" || s.status_code === "EXPIRED") throw new InstagramError("Instagram no pudo procesar la imagen (" + s.status_code + ")");
    await sleep(2000);
  }
  throw new InstagramError("Instagram tardó demasiado en procesar la imagen", 504);
}

export async function checkStock(productIds: string[]) {
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { name: true, variants: { where: { stock: { gt: 0 } }, select: { id: true }, take: 1 } },
  });
  return products.filter((p) => p.variants.length === 0).map((p) => p.name);
}

export async function publishPost(postId: string) {
  // Paso atomico approved -> publishing: si otro proceso ya lo tomo, no hace nada.
  const taken = await prisma.scheduledPost.updateMany({
    where: { id: postId, status: "approved", approvedAt: { not: null } },
    data: { status: "publishing", attempts: { increment: 1 } },
  });
  if (taken.count === 0) {
    const p = await prisma.scheduledPost.findUnique({ where: { id: postId } });
    if (p?.status === "published") return p;
    throw new InstagramError("El post no está aprobado o ya se está publicando", 409);
  }

  const post = await prisma.scheduledPost.findUniqueOrThrow({ where: { id: postId } });
  try {
    const noStock = await checkStock(post.productIds);
    if (noStock.length) {
      await prisma.scheduledPost.update({ where: { id: post.id }, data: { status: "paused", lastError: "Sin stock: " + noStock.join(", ") } });
      throw new InstagramError("No se publicó: sin stock en " + noStock.join(", "), 409);
    }

    const account = await prisma.socialAccount.findUniqueOrThrow({ where: { id: post.accountId } });
    if (account.status !== "active") throw new InstagramError("La cuenta de Instagram necesita reconectarse", 401, true);
    const token = decryptToken(account.accessTokenEnc);
    const uid = account.externalId;

    // Historias: cada imagen es una historia aparte (Instagram no tiene carrusel de stories).
    if (post.mediaType === "story") {
      const ids: string[] = [];
      for (const url of post.mediaUrls) {
        const c = await igPost(`/${uid}/media`, token, { image_url: url, media_type: "STORIES" });
        await waitReady(c.id, token);
        ids.push((await igPost(`/${uid}/media_publish`, token, { creation_id: c.id })).id);
      }
      return prisma.scheduledPost.update({
        where: { id: post.id },
        data: { status: "published", remoteId: ids.join(","), permalink: null, publishedAt: new Date(), lastError: null },
      });
    }

    let creationId: string;
    if (post.mediaUrls.length === 1) {
      creationId = (await igPost(`/${uid}/media`, token, { image_url: post.mediaUrls[0], caption: post.caption })).id;
    } else {
      const children: string[] = [];
      for (const url of post.mediaUrls) {
        const c = await igPost(`/${uid}/media`, token, { image_url: url, is_carousel_item: "true" });
        children.push(c.id);
      }
      for (const c of children) await waitReady(c, token);
      creationId = (await igPost(`/${uid}/media`, token, { media_type: "CAROUSEL", children: children.join(","), caption: post.caption })).id;
    }
    await waitReady(creationId, token);
    const published = await igPost(`/${uid}/media_publish`, token, { creation_id: creationId });
    const info = await igGet<{ permalink?: string }>(`/${published.id}`, token, "permalink");

    return prisma.scheduledPost.update({
      where: { id: post.id },
      data: { status: "published", remoteId: published.id, permalink: info.permalink || null, publishedAt: new Date(), lastError: null },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    const current = await prisma.scheduledPost.findUnique({ where: { id: post.id } });
    if (current?.status === "publishing") {
      await prisma.scheduledPost.update({ where: { id: post.id }, data: { status: "failed", lastError: msg.slice(0, 500) } });
    }
    if (e instanceof InstagramError && e.tokenInvalid) await markReauth(post.accountId);
    throw e;
  }
}
