import { NextResponse } from "next/server";
import { publishDue } from "@/lib/social/drafts";
import { socialDisabled } from "@/lib/ai/http";

// En local, el panel llama a esto cada minuto mientras esta abierto para
// publicar lo agendado. En produccion lo hace el cron externo (/api/social/cron).
export const maxDuration = 300;
export async function POST() {
  const off = socialDisabled();
  if (off) return off;
  return NextResponse.json({ results: await publishDue() });
}
