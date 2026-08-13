import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

// Endpoint NUEVO, no toca nada existente. Busca imagenes ya subidas a
// Cloudinary (Admin API, credenciales del servidor) para poder elegirlas
// en el admin sin tener que descargarlas y volver a subirlas.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const nextCursor = searchParams.get("next_cursor") || undefined;

    const expression = q ? q : "resource_type:image";

    let search = cloudinary.search
      .expression(expression)
      .sort_by("created_at", "desc")
      .max_results(40);

    if (nextCursor) {
      search = search.next_cursor(nextCursor);
    }

    const result = await search.execute();

    type CloudinaryResource = { public_id: string; secure_url: string; width: number; height: number };
    const resources: CloudinaryResource[] = result.resources || [];

    return NextResponse.json({
      images: resources.map((r) => ({
        publicId: r.public_id,
        url: r.secure_url,
        width: r.width,
        height: r.height,
      })),
      nextCursor: result.next_cursor || null,
    });
  } catch (error) {
    console.error("Error buscando en Cloudinary:", error);
    return NextResponse.json({ error: "Error al buscar en Cloudinary" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
