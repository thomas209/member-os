import { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_URL || "https://www.memberclubargentina.com";

const PRIVATE_PATHS = ["/admin", "/api", "/cuenta", "/checkout", "/receipt"];

// Bots de buscadores con IA (ChatGPT, Claude, Perplexity, Gemini, Apple, Bing).
// Se listan explícito para que el acceso quede claro aunque cambie la regla general.
const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: AI_BOTS, allow: "/", disallow: PRIVATE_PATHS },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
