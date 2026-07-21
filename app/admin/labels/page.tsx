export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";
import LabelsClient from "./LabelsClient";

export default async function LabelsPage() {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

  const products = await prisma.product.findMany({
    where: { deletedAt: null, isActive: true },
    include: {
      brand: { select: { name: true } },
      images: { where: { isPrimary: true }, take: 1 },
      variants: { select: { id: true, size: true, sku: true, stock: true }, orderBy: { sortOrder: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Generar el QR de cada variante en el servidor.
  // Codifica la URL publica del producto (con el id de variante como parametro "v"),
  // asi cualquiera que escanea con la camara del celular cae directo en la ficha del producto.
  // El POS sigue funcionando igual: extrae el "v" de esa misma URL al escanear (ver app/admin/pos/page.tsx).
  const productsWithQr = await Promise.all(
    products
      .filter((p) => p.variants.length > 0)
      .map(async (p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand.name,
        image: p.images[0]?.url ?? null,
        price: Number(p.price),
        variants: await Promise.all(
          p.variants.map(async (v) => ({
            id: v.id,
            size: v.size,
            stock: v.stock,
            qrDataUrl: await QRCode.toDataURL(`${baseUrl}/product/${p.slug}?v=${v.id}`, { width: 200, margin: 1 }),
          }))
        ),
      }))
  );

  return <LabelsClient products={productsWithQr} />;
}
