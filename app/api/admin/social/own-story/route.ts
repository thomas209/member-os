import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildOwnStory, ownMediaAllowed } from "@/lib/social/ownStory";
import { getInstagramAccount } from "@/lib/social/instagram";
import { socialDisabled, aiErrorResponse } from "@/lib/ai/http";
import { AiError } from "@/lib/ai/client";

export const runtime = "nodejs";
export const maxDuration = 60;

// Historias con fotos/videos propios.
// "build":    arma la version final (con logo/texto/producto) y devuelve la URL para la vista previa.
// "schedule": crea la historia y la agenda. Requiere confirm: true (el OK de Tommy).
export async function POST(request: NextRequest) {
  const off = socialDisabled();
  if (off) return off;
  try {
    const b = await request.json();
    if (b.action === "build") {
      const mediaUrl = await buildOwnStory({
        kind: b.kind === "video" ? "video" : "image",
        publicId: String(b.publicId || ""),
        mode: b.mode,
        text: b.text ? String(b.text) : undefined,
        productId: b.productId ? String(b.productId) : undefined,
        tag: b.tag ? String(b.tag) : null,
      }).catch((e) => { throw new AiError(e instanceof Error ? e.message : "No se pudo armar", 400); });
      return NextResponse.json({ mediaUrl });
    }
    if (b.action === "schedule") {
      if (b.confirm !== true) throw new AiError("Falta la confirmación", 400);
      const mediaUrl = String(b.mediaUrl || "");
      if (!ownMediaAllowed(mediaUrl)) throw new AiError("Archivo inválido", 400);
      const when = new Date(String(b.scheduledAt));
      if (isNaN(+when)) throw new AiError("Fecha inválida", 400);
      if (+when < Date.now() + 60_000) throw new AiError("Elegí una fecha y hora futura", 400);
      const account = await getInstagramAccount();
      if (!account) throw new AiError("Conectá Instagram primero", 400);
      const post = await prisma.scheduledPost.create({
        data: {
          accountId: account.id,
          productIds: b.productId ? [String(b.productId)] : [],
          caption: "",
          mediaUrls: [mediaUrl],
          mediaType: "story",
          status: "approved",
          approvedAt: new Date(),
          scheduledAt: when,
        },
      });
      return NextResponse.json({ post });
    }
    throw new AiError("Acción inválida", 400);
  } catch (e) {
    return aiErrorResponse(e);
  }
}
