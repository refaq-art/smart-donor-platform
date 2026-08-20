/**
 * ترقية مستخدم موجود إلى صلاحية مسؤول (Admin).
 * الاستخدام: npm run make-admin -- user@example.com
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("الاستخدام: npm run make-admin -- user@example.com");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) {
    console.error(`لا يوجد مستخدم بالبريد الإلكتروني: ${email}`);
    console.error("يجب أن ينشئ المستخدم حسابًا عاديًا أولًا عبر صفحة إنشاء حساب، ثم تشغيل هذا الأمر.");
    process.exit(1);
  }

  if (user.role === "ADMIN") {
    console.log(`المستخدم ${email} يمتلك صلاحية المسؤول بالفعل.`);
    return;
  }

  await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
  console.log(`تمت ترقية ${user.fullName} (${email}) إلى مسؤول بنجاح.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
