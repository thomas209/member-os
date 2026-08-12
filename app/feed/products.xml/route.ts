import { prisma } from "@/lib/prisma";

const SITE_URL = process.env.NEXT_PUBLIC_URL || "https://www.memberclubargentina.com";

// Meta (Instagram/Facebook Shopping) y Google Merchant leen este mismo formato
// de feed (RSS 2.0 + namespace g:). Se regenera solo — no hace falta subir
// nada a mano en Meta Commerce Manager, solo apuntar el catálogo a esta URL.
export const revalidate = 3600; // 1 hora

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cdata(value: string): string {
  return `<![CDATA[${value.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

export async function GET() {
  const products = await prisma.product.findMany({
    where: { isActive: true, deletedAt: null },
    include: {
      brand: { select: { name: true } },
      category: { select: { name: true } },
      images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
      variants: { select: { stock: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const items = products
    .filter((p) => p.images.length > 0)
    .map((p) => {
      const url = `${SITE_URL}/product/${p.slug}`;
      const inStock = p.variants.some((v) => v.stock > 0);
      const currentPrice = Number(p.price);
      const compareAt = p.comparePrice ? Number(p.comparePrice) : null;
      const isOnSale = compareAt !== null && compareAt > currentPrice;

      const priceLine = isOnSale
        ? `<g:price>${compareAt!.toFixed(2)} ARS</g:price>\n    <g:sale_price>${currentPrice.toFixed(2)} ARS</g:sale_price>`
        : `<g:price>${currentPrice.toFixed(2)} ARS</g:price>`;

      const description = p.metaDescription || p.description || `${p.name} de ${p.brand.name} en Member Club.`;

      const extraImages = p.images
        .slice(1, 11)
        .map((img) => `    <g:additional_image_link>${escapeXml(img.url)}</g:additional_image_link>`)
        .join("\n");

      return `  <item>
    <g:id>${p.id}</g:id>
    <g:title>${cdata(p.name)}</g:title>
    <g:description>${cdata(description)}</g:description>
    <g:link>${escapeXml(url)}</g:link>
    <g:image_link>${escapeXml(p.images[0].url)}</g:image_link>
${extraImages}
    <g:availability>${inStock ? "in stock" : "out of stock"}</g:availability>
    ${priceLine}
    <g:brand>${cdata(p.brand.name)}</g:brand>
    <g:condition>new</g:condition>
    <g:product_type>${cdata(p.category.name)}</g:product_type>
    <g:identifier_exists>no</g:identifier_exists>
  </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>Member Club</title>
  <link>${SITE_URL}</link>
  <description>Catálogo de productos de Member Club</description>
${items}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
