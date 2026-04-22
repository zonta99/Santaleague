import { test as setup } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.POSTGRES_PRISMA_URL! });
const prisma = new PrismaClient({ adapter });

setup("create test user", async () => {
  const hashedPassword = await bcrypt.hash("TestPassword123!", 10);

  await prisma.user.upsert({
    where: { email: "playwright@test.local" },
    update: { password: hashedPassword, emailVerified: new Date() },
    create: {
      email: "playwright@test.local",
      name: "Playwright Test",
      password: hashedPassword,
      emailVerified: new Date(),
    },
  });

  await prisma.$disconnect();
});
