// "Conectar con Instagram" (Instagram API with Instagram Login): el usuario
// acepta en Instagram y el servidor cambia el codigo por un token largo, sin
// copiar ni pegar tokens. Necesita INSTAGRAM_APP_SECRET en Vercel y la URL de
// callback cargada en Meta (Instagram business login → OAuth redirect URIs).
export const IG_APP_ID = process.env.INSTAGRAM_APP_ID || "4389918041268658";
export const IG_SCOPES = [
  "instagram_business_basic",
  "instagram_business_content_publish",
  "instagram_business_manage_messages",
  "instagram_business_manage_comments",
].join(",");

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_URL || "https://www.memberclubargentina.com").replace(/\/$/, "");
}
// Tiene que ser exactamente la cargada en Meta (Instagram business login).
export const redirectUri = () =>
  process.env.INSTAGRAM_REDIRECT_URI || "https://www.memberclubargentina.com/api/admin/social/instagram/callback";

export function authorizeUrl(state: string) {
  const u = new URL("https://www.instagram.com/oauth/authorize");
  u.searchParams.set("enable_fb_login", "0");
  u.searchParams.set("force_reauth", "true");
  u.searchParams.set("client_id", IG_APP_ID);
  u.searchParams.set("redirect_uri", redirectUri());
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", IG_SCOPES);
  u.searchParams.set("state", state);
  return u.toString();
}

// Codigo -> token corto -> token largo (60 dias, se renueva solo con el cron).
export async function exchangeCode(code: string) {
  const secret = process.env.INSTAGRAM_APP_SECRET;
  if (!secret) throw new Error("Falta INSTAGRAM_APP_SECRET en Vercel");
  const body = new URLSearchParams({
    client_id: IG_APP_ID, client_secret: secret, grant_type: "authorization_code",
    redirect_uri: redirectUri(), code: code.replace(/#_$/, ""),
  });
  const r1 = await fetch("https://api.instagram.com/oauth/access_token", { method: "POST", body });
  const d1 = await r1.json().catch(() => ({}));
  if (!r1.ok || !d1.access_token) throw new Error("Instagram no aceptó el código: " + (d1.error_message || d1.error?.message || r1.status));
  const u = new URL("https://graph.instagram.com/access_token");
  u.searchParams.set("grant_type", "ig_exchange_token");
  u.searchParams.set("client_secret", secret);
  u.searchParams.set("access_token", d1.access_token);
  const r2 = await fetch(u, { cache: "no-store" });
  const d2 = await r2.json().catch(() => ({}));
  if (!r2.ok || !d2.access_token) throw new Error("No se pudo pasar a token largo: " + (d2.error?.message || r2.status));
  return d2.access_token as string;
}
