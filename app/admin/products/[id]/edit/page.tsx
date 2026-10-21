import { prisma } from "@/lib/prisma";
import EditProductForm from "./EditProductForm";
import { notFound } from "next/navigation";
import CreatePostButton from "./CreatePostButton";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [rawProduct, brands, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        variants: { orderBy: { sortOrder: "asc" } },
        images: { orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  if (!rawProduct) notFound();

  // Serializar Decimals a strings para que Next.js pueda pasarlos al Client Component
  const product = {
    ...rawProduct,
    price: rawProduct.price.toString(),
    comparePrice: rawProduct.comparePrice?.toString() ?? null,
    salePrice: rawProduct.salePrice?.toString() ?? null,
    costPrice: rawProduct.costPrice?.toString() ?? null,
  };

  // Atajo a Instagram: solo si el modulo de redes esta prendido (en produccion queda oculto).
  const socialOn = process.env.FEATURE_SOCIAL === "true";
  const stock = rawProduct.variants.reduce((n, v) => n + (v.stock ?? 0), 0);
  const onSale = rawProduct.salePrice != null && Number(rawProduct.salePrice) < Number(rawProduct.price);
  const isNew = Date.now() - new Date(rawProduct.createdAt).getTime() < 14 * 24 * 60 * 60 * 1000;
  const defaultTag = onSale ? "SALE" : stock > 0 && stock <= 2 ? "ULTIMOS TALLES" : isNew ? "NEW IN" : "";

  return (
    <EditProductForm
      product={product}
      brands={brands}
      categories={categories}
      headerExtra={socialOn && rawProduct.images.length > 0 ? <CreatePostButton key="instagram" productId={rawProduct.id} defaultTag={defaultTag} /> : null}
    />
  );
}
