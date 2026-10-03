import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { parseLista } from "@/store/favorites";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Portada que muestra WhatsApp al compartir una lista de favoritos.
// Cuadrada, porque WhatsApp recorta la preview en un cuadrado centrado.

// Satori no decodifica bien .webp: le pedimos a Cloudinary la foto en jpg.
function jpg(url: string) {
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    return url.replace("/upload/", "/upload/f_jpg,w_400,h_500,c_pad,b_white/");
  }
  return url;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const favs = parseLista(searchParams.get("p"));
  const de = (searchParams.get("de") || "").replace(/[<>]/g, "").trim().slice(0, 24);
  const titulo = de ? "La selección de " + de : "Una selección de Member Club";

  let fotos: string[] = [];
  try {
    const products = favs.length
      ? await prisma.product.findMany({
          where: { slug: { in: favs.map((f) => f.slug) }, isActive: true, deletedAt: null },
          select: { slug: true, images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1, select: { url: true } } },
        })
      : [];
    fotos = favs
      .map((f) => products.find((p) => p.slug === f.slug)?.images[0]?.url)
      .filter((u): u is string => !!u)
      .slice(0, 3)
      .map(jpg);
  } catch {
    // sin fotos: la portada sale igual, solo con el texto
  }

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", backgroundColor: "#0A0A0A", color: "white", padding: 90 }}>
        <div style={{ display: "flex", fontSize: 30, letterSpacing: 10, opacity: 0.7 }}>MEMBER CLUB</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 30, letterSpacing: 6, color: "#DC2626", marginBottom: 24 }}>LISTA DE REGALOS</div>
          <div style={{ display: "flex", fontSize: 96, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>{titulo}</div>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {fotos.map((src, i) => (
            <div key={i} style={{ display: "flex", width: 300, height: 375, borderRadius: 28, overflow: "hidden", backgroundColor: "white" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} width={300} height={375} style={{ objectFit: "cover" }} alt="" />
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 1200 }
  );
}
