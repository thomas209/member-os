import { prisma } from "@/lib/prisma";
import EditProductForm from "./EditProductForm";
import { notFound } from "next/navigation";

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

  return <EditProductForm product={product} brands={brands} categories={categories} />;
}
