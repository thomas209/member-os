// Unico punto que habla con el proveedor de IA. Solo se usa del lado del
// servidor: la API key nunca llega al navegador. Antes de cada llamada
// revisa el tope de gasto del mes.
import { prisma } from "@/lib/prisma";
import { aiConfig } from "./config";

export class AiError extends Error {
  constructor(message: string, public status = 500) {
    super(message);
  }
}

export type ModelResult = {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
};

export async function spentThisMonthUsd(): Promise<number> {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const agg = await prisma.aiGeneration.aggregate({
    where: { createdAt: { gte: start } },
    _sum: { costUsd: true },
  });
  return Number(agg._sum.costUsd ?? 0);
}

// Bloques de contenido que acepta la API (texto e imagenes por URL).
export type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "url"; url: string } }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } };

export async function callModel(opts: {
  system: string;
  user: string | ContentBlock[];
  maxTokens?: number;
}): Promise<ModelResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new AiError("Falta ANTHROPIC_API_KEY en el .env", 500);

  const spent = await spentThisMonthUsd();
  if (spent >= aiConfig.monthlyBudgetUsd) {
    throw new AiError(
      `Se alcanzo el tope de gasto de IA del mes (USD ${aiConfig.monthlyBudgetUsd}).`,
      429
    );
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: aiConfig.model,
      max_tokens: opts.maxTokens ?? 800,
      system: opts.system,
      messages: [{ role: "user", content: opts.user }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[ai] error del proveedor", res.status, detail.slice(0, 500));
    let reason = "";
    try {
      reason = JSON.parse(detail)?.error?.message || "";
    } catch {}
    throw new AiError("La IA no respondio (" + res.status + ")" + (reason ? ": " + reason.slice(0, 200) : ". Proba de nuevo en un rato."), 502);
  }

  const data = await res.json();
  const text = (data.content || [])
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("")
    .trim();
  const inputTokens = data.usage?.input_tokens ?? 0;
  const outputTokens = data.usage?.output_tokens ?? 0;
  const costUsd =
    (inputTokens * aiConfig.priceInputPerMTok + outputTokens * aiConfig.priceOutputPerMTok) / 1_000_000;

  return { text, model: data.model || aiConfig.model, inputTokens, outputTokens, costUsd };
}
