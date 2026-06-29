import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123456", 10);

  const admin = await prisma.adminUser.upsert({
    where: { email: "admin@memberclub.com" },
    update: {},
    create: {
      email: "admin@memberclub.com",
      passwordHash,
      firstName: "Thomas",
      lastName: "Caronia",
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  console.log("Admin creado:");
  console.log("Email:", admin.email);
  console.log("Password: admin123456");
  console.log("Rol:", admin.role);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
