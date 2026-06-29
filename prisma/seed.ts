import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding...");

  // Marcas
  const nike = await prisma.brand.upsert({
    where: { slug: "nike" },
    update: {},
    create: { name: "Nike", slug: "nike" },
  });

  const adidas = await prisma.brand.upsert({
    where: { slug: "adidas" },
    update: {},
    create: { name: "Adidas", slug: "adidas" },
  });

  // Categorias
  const zapatillas = await prisma.category.upsert({
    where: { slug: "zapatillas" },
    update: {},
    create: { name: "Zapatillas", slug: "zapatillas", sortOrder: 1 },
  });

  const ropa = await prisma.category.upsert({
    where: { slug: "ropa" },
    update: {},
    create: { name: "Ropa", slug: "ropa", sortOrder: 2 },
  });

  // Productos
  const af1 = await prisma.product.upsert({
    where: { slug: "nike-air-force-1-white" },
    update: {},
    create: {
      name: "Air Force 1",
      slug: "nike-air-force-1-white",
      description: "El clasico de Nike en su version mas pura. Cuero blanco, suela blanca.",
      brandId: nike.id,
      categoryId: zapatillas.id,
      gender: "UNISEX",
      price: 89999,
      comparePrice: 99999,
      colorName: "White",
      colorHex: "#FFFFFF",
      groupSlug: "nike-air-force-1",
      isFeatured: true,
      isActive: true,
    },
  });

  const af1Black = await prisma.product.upsert({
    where: { slug: "nike-air-force-1-black" },
    update: {},
    create: {
      name: "Air Force 1",
      slug: "nike-air-force-1-black",
      description: "El clasico de Nike en negro. Cuero negro, suela blanca.",
      brandId: nike.id,
      categoryId: zapatillas.id,
      gender: "UNISEX",
      price: 89999,
      colorName: "Black",
      colorHex: "#0A0A0A",
      groupSlug: "nike-air-force-1",
      isFeatured: true,
      isActive: true,
    },
  });

  const ultraboost = await prisma.product.upsert({
    where: { slug: "adidas-ultraboost-white" },
    update: {},
    create: {
      name: "Ultraboost 22",
      slug: "adidas-ultraboost-white",
      description: "Maximo confort con tecnologia Boost. Para correr o para la calle.",
      brandId: adidas.id,
      categoryId: zapatillas.id,
      gender: "HOMBRE",
      price: 124999,
      colorName: "White",
      colorHex: "#FFFFFF",
      isFeatured: true,
      isActive: true,
    },
  });

  const campus = await prisma.product.upsert({
    where: { slug: "adidas-campus-green" },
    update: {},
    create: {
      name: "Campus 00s",
      slug: "adidas-campus-green",
      description: "El retro de Adidas que volvio para quedarse.",
      brandId: adidas.id,
      categoryId: zapatillas.id,
      gender: "UNISEX",
      price: 79999,
      colorName: "Green",
      colorHex: "#4A7C59",
      isFeatured: false,
      isActive: true,
    },
  });

  // Variantes de talle para cada producto
  const talles = ["38", "39", "40", "41", "42", "43", "44"];
  
  for (const product of [af1, af1Black, ultraboost, campus]) {
    for (let i = 0; i < talles.length; i++) {
      await prisma.productVariant.upsert({
        where: { productId_size: { productId: product.id, size: talles[i] } },
        update: {},
        create: {
          productId: product.id,
          size: talles[i],
          stock: Math.floor(Math.random() * 5),
          sortOrder: i,
        },
      });
    }
  }

  console.log("Seed completo:");
  console.log("- 2 marcas");
  console.log("- 2 categorias");
  console.log("- 4 productos");
  console.log("- 28 variantes de talle");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
