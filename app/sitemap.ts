import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const SITE_URL = process.env.NEXT_PUBLIC_URL || "https://www.memberclubargentina.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, deletedAt: null },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.category.findMany({ where: { isActive: true }, select: { slug: true } }),
    prisma.brand.findMany({ where: { isActive: true }, select: { slug: true } }),
  ]);

  // Nota: "/stores", "/encargos" y "/bigboy" están linkeados en el header
  // pero no tienen una ruta implementada en app/ (devuelven 404 en el sitio
  // en vivo) — no se incluyen acá hasta que existan. Ver informe de mejoras.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/catalog`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/catalog?gender=HOMBRE`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/catalog?gender=MUJER`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/catalog?encargo=1`, changeFrequency: "weekly", priority: 0.6 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SITE_URL}/catalog?category=${c.slug}`,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  const brandRoutes: MetadataRoute.Sitemap = brands.map((b) => ({
    url: `${SITE_URL}/catalog?brand=${b.slug}`,
    changeFrequency: "daily",
    priority: 0.5,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE_URL}/product/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...categoryRoutes, ...brandRoutes, ...productRoutes];
}
