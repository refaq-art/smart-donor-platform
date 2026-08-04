import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

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

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
