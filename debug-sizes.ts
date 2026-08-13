import { prisma } from "./lib/prisma";

async function main() {
  const variants = await prisma.productVariant.findMany({
    where: { stock: { gt: 0 } },
    select: {
      size: true,
      stock: true,
      product: { select: { name: true, brand: { select: { name: true } } } },
    },
    take: 40,
    orderBy: { product: { name: "asc" } },
  });

  console.log(JSON.stringify(variants, null, 2));
  process.exit(0);
}

main();
