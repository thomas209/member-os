import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AddToCart from "@/components/store/AddToCart";
import ProductGallery from "@/components/store/ProductGallery";

const SITE_URL = process.env.NEXT_PUBLIC_URL || "https://www.memberclubargentina.com";

async function getProduct(slug: string) {
  return prisma.product.findFirst({
    where: { slug, isActive: true, deletedAt: null },
    include: {
      brand: { select: { name: true, slug: true } },
      category: { select: { name: true, slug: true } },
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return { title: "Producto no encontrado" };
  }

  const title = product.metaTitle || `${product.name} | ${product.brand.name}`;
  const description =
    product.metaDescription ||
    (product.description
      ? product.description.slice(0, 160)
      : `Comprá ${product.name} de ${product.brand.name} en Member Club. Envíos a todo el país.`);
  const image = product.images[0]?.url;
  const url = `${SITE_URL}/product/${product.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "Member Club",
      images: image ? [{ url: image, width: 1200, height: 1500, alt: product.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const product = await getProduct(slug);

  if (!product) notFound();

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-6 md:px-12 md:py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-20">

        <ProductGallery images={product.images} productName={product.name} />

        <div className="pt-0 md:pt-6 pb-24 md:pb-0">
          <p className="text-[11px] tracking-widest uppercase text-neutral-400 mb-3">
            {product.brand.name}
          </p>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight mb-2">
            {product.name}
          </h1>
          {product.colorName && (
            <p className="text-sm text-neutral-400 mb-6">
              Color: {product.colorName}
            </p>
          )}
          <div className="flex items-baseline gap-3 mb-8">
            <p className="text-2xl md:text-3xl font-bold">
              ${Number(product.price).toLocaleString("es-AR")}
            </p>
            {product.comparePrice && (
              <p className="text-base text-neutral-400 line-through">
                ${Number(product.comparePrice).toLocaleString("es-AR")}
              </p>
            )}
          </div>

          <AddToCart
            variants={product.variants}
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              brand: product.brand.name,
              price: Number(product.price),
              image: product.images[0]?.url ?? null,
              isEncargo: product.isEncargo,
            }}
          />

          {product.description && (
            <div className="mt-10 pt-10 border-t border-neutral-100">
              <p className="text-[11px] font-semibold tracking-widest uppercase mb-4">
                Descripción
              </p>
              <p className="text-sm text-neutral-500 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
