import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
// نستخدم عميل HTTP الصرف (بدون امتدادات ثنائية أصلية) بدلاً من العميل الافتراضي
// لأن الافتراضي يعتمد على حزمة "libsql" الأصلية (لدعم النسخ المحلية المضمّنة)، وهي
// غير مضمونة التضمين الصحيح في حزم دوال الاستضافة بلا حالة مثل Vercel. عميل HTTP
// كافٍ تمامًا للاتصال البعيد بـ Turso الذي نحتاجه هنا.
import { createClient } from "@libsql/client/web";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const logLevels = (process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]) as (
  | "error"
  | "warn"
)[];

// عند التشغيل المحلي: يُستخدم ملف SQLite العادي عبر DATABASE_URL كما هو معتاد، بدون أي إعداد إضافي.
// عند النشر على استضافة بدون قرص دائم (مثل Vercel): يُضبط TURSO_DATABASE_URL و TURSO_AUTH_TOKEN
// لاستخدام قاعدة بيانات Turso (متوافقة مع SQLite) عبر مهايئ Prisma الرسمي، دون تغيير أي كود آخر
// في المشروع. راجع قسم "النشر السحابي المجاني" في README.md للتفاصيل.
function createPrismaClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;

  if (tursoUrl) {
    const libsql = createClient({
      url: tursoUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const adapter = new PrismaLibSQL(libsql);
    return new PrismaClient({ adapter, log: logLevels });
  }

  return new PrismaClient({ log: logLevels });
}

// إنشاء العميل بشكل كسول (عند أول استخدام فعلي) بدلاً من وقت استيراد الوحدة —
// لتفادي أي تنفيذ غير متوقع لمنطق الاتصال إذا جُمِّعت هذه الوحدة ضمن حزمة مشتركة
// تُقيَّم لمسارات لا تستخدم قاعدة البيانات أصلًا (مثل صفحة تسجيل الدخول).
function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getPrismaClient(), prop, receiver);
  },
});
