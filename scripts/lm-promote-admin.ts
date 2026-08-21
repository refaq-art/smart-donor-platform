// ترقية مستخدم موجود في وحدة "إدارة العملاء والمهل والأقساط" إلى مدير عام.
// الاستخدام: npm run lm:promote-admin -- 05XXXXXXXX
import { PrismaClient } from "@prisma/client";
import { normalizeSaudiPhone } from "../src/lib/lm/validation";

const prisma = new PrismaClient();

async function main() {
  const rawPhone = process.argv[2];
  if (!rawPhone) {
    console.error("الاستخدام: npm run lm:promote-admin -- 05XXXXXXXX");
    process.exit(1);
  }

  const phone = normalizeSaudiPhone(rawPhone);
  if (!phone) {
    console.error("رقم جوال سعودي غير صحيح:", rawPhone);
    process.exit(1);
  }

  const user = await prisma.lmUser.findUnique({ where: { phone } });
  if (!user) {
    console.error("لا يوجد مستخدم مسجَّل بهذا الرقم في وحدة المهل والأقساط. سجّل حسابًا عاديًا أولًا عبر /installments/register ثم أعد تشغيل هذا الأمر.");
    process.exit(1);
  }

  await prisma.lmUser.update({ where: { id: user.id }, data: { role: "ADMIN" } });
  console.log(`تمت ترقية "${user.name}" (${rawPhone}) إلى مدير عام. سجّل الدخول من /installments/login وستظهر "لوحة الإدارة" في القائمة الجانبية.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
