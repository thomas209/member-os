import { NextResponse } from "next/server";
import { getSuggestions } from "@/lib/social/suggestions";
import { socialDisabled } from "@/lib/ai/http";

export async function GET() {
  const off = socialDisabled();
  if (off) return off;
  return NextResponse.json({ suggestions: await getSuggestions() });
}
