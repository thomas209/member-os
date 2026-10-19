// Cliente de Canva Connect API. Solo servidor.
// Flujo: OAuth (PKCE) -> subir foto del producto como asset -> autofill de
// un diseno plantilla con campos de "Data autofill" -> exportar PNG.
//
//   CANVA_CLIENT_ID / CANVA_CLIENT_SECRET  -> de la integracion en canva.com/developers
//   CANVA_REDIRECT_URI                      -> http://127.0.0.1:3000/api/social/canva/callback
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { encryptToken, decryptToken } from "./crypto";

const API = "https://api.canva.com/rest/v1";
export const CANVA_SCOPES = [
  "asset:read",
  "asset:write",
  "design:content:read",
  "design:content:write",
  "design:meta:read",
].join(" ");

export class CanvaError extends Error {
  constructor(message: string, public status = 502) {
    super(message);
  }
}

function cfg() {
  const id = process.env.CANVA_CLIENT_ID;
  const secret = process.env.CANVA_CLIENT_SECRET;
  const redirect = process.env.CANVA_REDIRECT_URI || "http://127.0.0.1:3000/api/social/canva/callback";
  if (!id || !secret) throw new CanvaError("Faltan CANVA_CLIENT_ID / CANVA_CLIENT_SECRET en el .env", 500);
  return { id, secret, redirect };
}

// ---------- OAuth ----------
// El "state" lleva el code_verifier cifrado + la hora: asi no hace falta
// guardar nada entre el inicio y el callback (que vuelve por 127.0.0.1).
export function buildAuthUrl() {
  const { id, redirect } = cfg();
  const verifier = crypto.randomBytes(48).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
  const state = encryptToken(JSON.stringify({ v: verifier, t: Date.now() }));
  const u = new URL("https://www.canva.com/api/oauth/authorize");
  u.searchParams.set("client_id", id);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("code_challenge", challenge);
  u.searchParams.set("code_challenge_method", "S256");
  u.searchParams.set("scope", CANVA_SCOPES);
  u.searchParams.set("redirect_uri", redirect);
  u.searchParams.set("state", state);
  return u.toString();
}

type Tokens = { access: string; refresh: string };

async function tokenRequest(body: Record<string, string>) {
  const { id, secret } = cfg();
  const res = await fetch(API + "/oauth/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
    },
    body: new URLSearchParams(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("[canva] token", res.status, JSON.stringify(data).slice(0, 300));
    throw new CanvaError("Canva rechazo la autorizacion. Volve a conectar.", 401);
  }
  return data as { access_token: string; refresh_token: string; expires_in: number };
}

async function saveTokens(t: { access_token: string; refresh_token: string; expires_in: number }) {
  const data = {
    accessTokenEnc: encryptToken(JSON.stringify({ access: t.access_token, refresh: t.refresh_token } satisfies Tokens)),
    tokenExpiresAt: new Date(Date.now() + (t.expires_in - 60) * 1000),
    status: "active",
    handle: "Canva",
  };
  return prisma.socialAccount.upsert({
    where: { platform_externalId: { platform: "canva", externalId: "default" } },
    create: { platform: "canva", externalId: "default", ...data },
    update: data,
  });
}

export async function handleCallback(code: string, state: string) {
  let verifier: string;
  try {
    const s = JSON.parse(decryptToken(state));
    if (Date.now() - s.t > 15 * 60 * 1000) throw new Error("vencido");
    verifier = s.v;
  } catch {
    throw new CanvaError("El pedido de conexion vencio o no es valido. Volve a intentar.", 400);
  }
  const { redirect } = cfg();
  const t = await tokenRequest({ grant_type: "authorization_code", code, code_verifier: verifier, redirect_uri: redirect });
  return saveTokens(t);
}

export async function getCanvaAccount() {
  return prisma.socialAccount.findFirst({ where: { platform: "canva", status: "active" } });
}

// Devuelve un access token valido; si vencio lo renueva (el refresh token
// de Canva es de un solo uso, por eso se guarda el nuevo).
async function accessToken(): Promise<string> {
  const acc = await getCanvaAccount();
  if (!acc) throw new CanvaError("Canva no esta conectado", 400);
  const tokens: Tokens = JSON.parse(decryptToken(acc.accessTokenEnc));
  if (acc.tokenExpiresAt && acc.tokenExpiresAt > new Date()) return tokens.access;
  try {
    const t = await tokenRequest({ grant_type: "refresh_token", refresh_token: tokens.refresh });
    await saveTokens(t);
    return t.access_token;
  } catch (e) {
    await prisma.socialAccount.update({ where: { id: acc.id }, data: { status: "reauth_required" } });
    throw e;
  }
}

async function canva<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await accessToken();
  const res = await fetch(API + path, {
    ...init,
    headers: { authorization: "Bearer " + token, "content-type": "application/json", ...(init.headers || {}) },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("[canva]", path, res.status, JSON.stringify(data).slice(0, 400));
    throw new CanvaError("Canva respondio con error (" + res.status + "): " + (data.message || data.code || ""), res.status === 401 ? 401 : 502);
  }
  return data as T;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Job<T> = { job: { id: string; status: "in_progress" | "success" | "failed"; error?: { message: string } } & T };

async function pollJob<T>(path: string, maxMs = 60_000): Promise<Job<T>["job"]> {
  const start = Date.now();
  let wait = 800;
  while (Date.now() - start < maxMs) {
    const { job } = await canva<Job<T>>(path);
    if (job.status === "success") return job;
    if (job.status === "failed") throw new CanvaError("Canva no pudo completar la tarea: " + (job.error?.message || ""));
    await sleep(wait);
    wait = Math.min(wait * 1.5, 4000);
  }
  throw new CanvaError("Canva tardo demasiado. Proba de nuevo.", 504);
}

// ---------- Diseno plantilla ----------
// Acepta el link del diseno (canva.com/design/XXXX/...) o el ID directo.
export function parseDesignId(input: string): string | null {
  const m = input.match(/design\/([A-Za-z0-9_-]{8,})/);
  if (m) return m[1];
  return /^[A-Za-z0-9_-]{8,}$/.test(input.trim()) ? input.trim() : null;
}

export type CanvaDataset = Record<string, { type: "image" | "text" | "chart" }>;

export async function getDesignDataset(designId: string): Promise<CanvaDataset> {
  const d = await canva<{ dataset?: CanvaDataset }>(`/designs/${designId}/dataset`);
  return d.dataset || {};
}

// ---------- Generar imagen ----------
export async function uploadAssetFromUrl(url: string, name: string): Promise<string> {
  const { job } = await canva<Job<{ asset?: { id: string } }>>("/url-asset-uploads", {
    method: "POST",
    body: JSON.stringify({ url, name: name.slice(0, 250) }),
  });
  const done = job.status === "success" ? job : await pollJob<{ asset?: { id: string } }>(`/url-asset-uploads/${job.id}`);
  if (!done.asset?.id) throw new CanvaError("Canva no devolvio el asset subido");
  return done.asset.id;
}

type AutofillValue = { type: "image"; asset_id: string } | { type: "text"; text: string };

export async function autofillDesign(designId: string, title: string, data: Record<string, AutofillValue>) {
  type R = { result?: { design: { id: string; urls?: { edit_url?: string } } } };
  const { job } = await canva<Job<R>>("/autofills", {
    method: "POST",
    body: JSON.stringify({ type: "create_from_design", design_id: designId, title: title.slice(0, 250), data }),
  });
  const done = job.status === "success" ? job : await pollJob<R>(`/autofills/${job.id}`, 90_000);
  if (!done.result?.design?.id) throw new CanvaError("Canva no devolvio el diseno generado");
  return { designId: done.result.design.id, editUrl: done.result.design.urls?.edit_url || null };
}

export async function exportPng(designId: string): Promise<string[]> {
  const { job } = await canva<Job<{ urls?: string[] }>>("/exports", {
    method: "POST",
    body: JSON.stringify({ design_id: designId, format: { type: "png", width: 1080 } }),
  });
  const done = job.status === "success" ? job : await pollJob<{ urls?: string[] }>(`/exports/${job.id}`, 90_000);
  if (!done.urls?.length) throw new CanvaError("Canva no devolvio la imagen exportada");
  return done.urls;
}
