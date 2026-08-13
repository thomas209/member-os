import { createAgentUIStreamResponse } from "ai";
import { shoppingAssistant } from "@/lib/ai/agent";

export async function POST(req: Request) {
  const { messages } = await req.json();

  return createAgentUIStreamResponse({
    agent: shoppingAssistant,
    uiMessages: messages,
  });
}

// Corre en Node (no Edge): las tools usan Prisma, que necesita el runtime de Node.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
