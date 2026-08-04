import { PrismaClient } from "@prisma/client";
import { seedDemoData } from "../src/lib/seed-data";

const prisma = new PrismaClient();

seedDemoData(prisma)
  .then(() => {
    console.log("");
    console.log("بيانات الدخول التجريبية (كلمة المرور للجميع: Passw0rd!):");
    console.log("- مدير النظام:      admin@refaq.org");
    console.log("- مدير الجمعية:      manager@refaq.org");
    console.log("- مسؤول المنح:       officer@refaq.org");
    console.log("- مراجع:            reviewer@refaq.org");
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
