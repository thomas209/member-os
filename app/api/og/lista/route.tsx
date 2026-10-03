import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { parseLista } from "@/store/favorites";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Portada que muestra WhatsApp al compartir una lista de favoritos.
// Cuadrada, porque WhatsApp recorta la preview en un cuadrado centrado.
// Mismo estilo que la tienda: fondo blanco, logo, rotulos en monoespaciada,
// fotos en cards redondeadas y boton pastilla negro.

const LOGO_URL = "https://res.cloudinary.com/dklvmlzds/image/upload/v1783912898/MEMBER_B_1_3_wyfasx.png";

// Satori no decodifica bien .webp: le pedimos a Cloudinary la foto en jpg,
// ya recortada al formato de las cards (4:5).
function jpg(url: string) {
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    return url.replace("/upload/", "/upload/f_jpg,w_660,h_825,c_fill/");
  }
  return url;
}

// Tipografias de la tienda (DM Mono e Instrument Sans). Si Google Fonts no
// responde, la portada sale igual con la tipografia por defecto.
async function loadFont(family: string, weight: number): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch("https://fonts.googleapis.com/css2?family=" + family + ":wght@" + weight)).text();
    const match = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
    if (!match) return null;
    const res = await fetch(match[1]);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const favs = parseLista(searchParams.get("p"));
  const de = (searchParams.get("de") || "").replace(/[<>]/g, "").trim().slice(0, 24);
  const titulo = de ? "La selección de " + de : "Una selección de Member Club";

  let cards: { src: string; size: string | null }[] = [];
  let total = favs.length;
  try {
    const products = favs.length
      ? await prisma.product.findMany({
          where: { slug: { in: favs.map((f) => f.slug) }, isActive: true, deletedAt: null },
          select: { slug: true, images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1, select: { url: true } } },
        })
      : [];
    const conFoto = favs
      .map((f) => ({ size: f.size, url: products.find((p) => p.slug === f.slug)?.images[0]?.url }))
      .filter((x): x is { size: string | null; url: string } => !!x.url);
    total = products.length;
    cards = conFoto.slice(0, 3).map((x) => ({ src: jpg(x.url), size: x.size }));
  } catch {
    // sin fotos: la portada sale igual, solo con el texto
  }

  const [mono, sans] = await Promise.all([loadFont("DM+Mono", 500), loadFont("Instrument+Sans", 600)]);
  const fonts = [
    ...(mono ? [{ name: "Mono", data: mono, weight: 500 as const, style: "normal" as const }] : []),
    ...(sans ? [{ name: "Sans", data: sans, weight: 600 as const, style: "normal" as const }] : []),
  ];
  const monoFamily = mono ? "Mono" : undefined;
  const sansFamily = sans ? "Sans" : undefined;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", backgroundColor: "#FFFFFF", color: "#0A0A0A", padding: 80 }}>
        {/* Logo + rotulo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_URL} width={230} height={56} style={{ objectFit: "contain", objectPosition: "left" }} alt="" />
          <div style={{ display: "flex", fontFamily: monoFamily, fontSize: 24, letterSpacing: 3, color: "#DC2626" }}>LISTA DE REGALOS</div>
        </div>

        {/* Titulo */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontFamily: sansFamily, fontSize: 92, fontWeight: 600, lineHeight: 1.04, letterSpacing: -3 }}>{titulo}</div>
          <div style={{ display: "flex", fontFamily: monoFamily, fontSize: 26, letterSpacing: 3, color: "#6E6E73", marginTop: 22 }}>
            {total + (total === 1 ? " PRODUCTO" : " PRODUCTOS") + " · CON SUS TALLES"}
          </div>
        </div>

        {/* Fotos en cards, como en el catalogo */}
        <div style={{ display: "flex", gap: 20 }}>
          {cards.map((c, i) => (
            <div key={i} style={{ display: "flex", position: "relative", width: 333, height: 416, borderRadius: 36, overflow: "hidden", backgroundColor: "#F4F4F4" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.src} width={333} height={416} style={{ objectFit: "cover" }} alt="" />
              {c.size && (
                <div style={{ display: "flex", position: "absolute", left: 16, bottom: 16, backgroundColor: "rgba(10,10,10,0.82)", color: "white", fontFamily: monoFamily, fontSize: 20, letterSpacing: 2, borderRadius: 999, padding: "10px 18px" }}>
                  {"TALLE " + c.size.toUpperCase()}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Boton pastilla + dominio */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", backgroundColor: "#0A0A0A", color: "white", fontFamily: sansFamily, fontSize: 32, fontWeight: 600, borderRadius: 999, padding: "22px 44px" }}>Ver la lista</div>
          <div style={{ display: "flex", fontFamily: monoFamily, fontSize: 22, letterSpacing: 2, color: "#6E6E73" }}>MEMBERCLUBARGENTINA.COM</div>
        </div>
      </div>
    ),
    { width: 1200, height: 1200, ...(fonts.length ? { fonts } : {}) }
  );
}
