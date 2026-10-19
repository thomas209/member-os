// Cliente minimo de la API oficial de Instagram (Instagram API with
// Instagram Login, graph.instagram.com). Solo servidor.
import { prisma } from "@/lib/prisma";
import { decryptToken, encryptToken } from "./crypto";

const GRAPH = "https://graph.instagram.com";

export class InstagramError extends Error {
  constructor(message: string, public status = 502, public tokenInvalid = false) {
    super(message);
  }
}

async function ig<T>(path: string, token: string, params: Record<string, string> = {}, method = "GET"): Promise<T> {
  const url = new URL(GRAPH + path);
  const body = new URLSearchParams({ ...params, access_token: token });
  let res: Response;
  if (method === "GET") {
    body.forEach((v, k) => url.searchParams.set(k, v));
    res = await fetch(url, { cache: "no-store" });
  } else {
    res = await fetch(url, { method, body });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    const err = data.error || {};
    // 190 = token invalido o vencido
    const tokenInvalid = err.code === 190;
    console.error("[instagram]", res.status, err.code, err.message);
    throw new InstagramError(
      tokenInvalid ? "El token de Instagram no es valido o vencio. Hay que reconectar." : "Instagram respondio con error: " + (err.message || res.status),
      tokenInvalid ? 401 : 502,
      tokenInvalid
    );
  }
  return data as T;
}

export type IgProfile = {
  user_id: string;
  username: string;
  account_type?: string;
  profile_picture_url?: string;
  followers_count?: number;
  media_count?: number;
};

export function getProfile(token: string) {
  return ig<IgProfile>("/me", token, {
    fields: "user_id,username,account_type,profile_picture_url,followers_count,media_count",
  });
}

export type IgMedia = {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
};

// Trae hasta `limit` posts propios, paginando.
export async function listMedia(token: string, limit = 100): Promise<IgMedia[]> {
  const out: IgMedia[] = [];
  let page = await ig<{ data: IgMedia[]; paging?: { next?: string } }>("/me/media", token, {
    fields: "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count",
    limit: "50",
  });
  out.push(...page.data);
  while (out.length < limit && page.paging?.next) {
    const res = await fetch(page.paging.next, { cache: "no-store" });
    page = await res.json();
    if (!page?.data) break;
    out.push(...page.data);
  }
  return out.slice(0, limit);
}

// Guarda (o actualiza) la cuenta conectada con el token cifrado.
export async function connectInstagram(token: string) {
  const profile = await getProfile(token);
  const data = {
    handle: profile.username,
    profilePictureUrl: profile.profile_picture_url || null,
    accessTokenEnc: encryptToken(token),
    // Los tokens largos de Instagram duran 60 dias.
    tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    status: "active",
  };
  return prisma.socialAccount.upsert({
    where: { platform_externalId: { platform: "instagram", externalId: profile.user_id } },
    create: { platform: "instagram", externalId: profile.user_id, ...data },
    update: data,
  });
}

export async function getInstagramAccount() {
  return prisma.socialAccount.findFirst({
    where: { platform: "instagram", status: { not: "disconnected" } },
    orderBy: { updatedAt: "desc" },
  });
}

// Devuelve el token descifrado de la cuenta activa, o error claro.
export async function getActiveToken() {
  const account = await getInstagramAccount();
  if (!account) throw new InstagramError("No hay cuenta de Instagram conectada", 400);
  if (account.status === "reauth_required") throw new InstagramError("La cuenta necesita reconectarse", 401, true);
  return { account, token: decryptToken(account.accessTokenEnc) };
}

export async function markReauth(accountId: string) {
  await prisma.socialAccount.update({ where: { id: accountId }, data: { status: "reauth_required" } });
}
