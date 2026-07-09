export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";
import LabelsClient from "./LabelsClient";

export default async function LabelsPage() {
  const products = await prisma.product.findMany({
    where: { deletedAt: null, isActive: true },
    include: {
      brand: { select: { name: true } },
      variants: { select: { id: true, size: true, sku: true, stock: true }, orderBy: { sortOrder: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Generar el QR de cada variante en el servidor (codifica el id de la variante)
  const productsWithQr = await Promise.all(
    products
      .filter((p) => p.variants.length > 0)
      .map(async (p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand.name,
        price: Number(p.price),
        variants: await Promise.all(
          p.variants.map(async (v) => ({
            id: v.id,
            size: v.size,
            stock: v.stock,
            qrDataUrl: await QRCode.toDataURL(v.id, { width: 200, margin: 1 }),
          }))
        ),
      }))
  );

  return <LabelsClient products={productsWithQr} />;
}
