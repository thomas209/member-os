import { NextRequest, NextResponse } from "next/server";
import { publishDue } from "@/lib/social/drafts";
import { isSocialEnabled } from "@/lib/ai/config";

// Cron externo (cron-job.org) cada 10 min en produccion. Requiere el header
// x-cron-secret igual a CRON_SECRET. Solo publica posts que Tommy aprobo.
export const maxDuration = 300;
export async function POST(request: NextRequest) {
  if (!isSocialEnabled()) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("x-cron-secret") !== secret) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json({ results: await publishDue() });
}
