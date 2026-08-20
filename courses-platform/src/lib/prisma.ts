import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
// نستخدم عميل HTTP الصرف (بدون امتدادات ثنائية أصلية) بدلاً من العميل الافتراضي
// لأن الافتراضي يعتمد على حزمة "libsql" الأصلية، وهي غير مضمونة التضمين الصحيح
// في حزم دوال الاستضافة بلا حالة مثل Vercel. عميل HTTP كافٍ تمامًا للاتصال
// البعيد بـ Turso الذي نحتاجه هنا.
import { createClient } from "@libsql/client/web";
import { ensureServerlessDemoDatabase } from "@/lib/demo-seed";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaReady: Promise<void> | undefined;
};

const logLevels = (process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]) as (
  | "error"
  | "warn"
)[];

// عند التشغيل المحلي: يُستخدم ملف SQLite العادي عبر DATABASE_URL كما هو معتاد.
// عند النشر على استضافة بلا قرص دائم (مثل Vercel): يُضبط TURSO_DATABASE_URL و
// TURSO_AUTH_TOKEN لاستخدام قاعدة بيانات Turso (متوافقة مع SQLite) دون تغيير أي
// كود آخر في المشروع. راجع قسم "النشر المجاني" في README.md للتفاصيل.
//
// وضع العرض السريع بلا Turso على Vercel: نظام الملفات في دوال Vercel للقراءة فقط
// باستثناء /tmp القابل للكتابة والمعزول لكل نسخة تشغيل (تُصفَّر عند بدء نسخة
// باردة جديدة). بما أنه لا يوجد ملف قاعدة بيانات جاهز نعتمد عليه هنا، تُنشأ
// الجداول وتُعبَّأ بالبيانات التجريبية برمجيًا عند أول استخدام لكل نسخة عبر
// ensureServerlessDemoDatabase (راجع src/lib/demo-seed.ts) — مناسب لعرض تجريبي
// سريع بلا قاعدة بيانات سحابية، وليس للاستخدام الفعلي في الإنتاج.
function createPrismaClient(): { client: PrismaClient; ready: Promise<void> } {
  const tursoUrl = process.env.TURSO_DATABASE_URL;

  if (tursoUrl) {
    const libsql = createClient({
      url: tursoUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const adapter = new PrismaLibSQL(libsql);
    return { client: new PrismaClient({ adapter, log: logLevels }), ready: Promise.resolve() };
  }

  if (process.env.VERCEL) {
    const client = new PrismaClient({
      log: logLevels,
      datasources: { db: { url: "file:/tmp/dev.db" } },
    });
    const ready = ensureServerlessDemoDatabase(client).catch((error) => {
      console.error("فشل تهيئة قاعدة بيانات وضع العرض على Vercel:", error);
    });
    return { client, ready };
  }

  return { client: new PrismaClient({ log: logLevels }), ready: Promise.resolve() };
}

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const { client, ready } = createPrismaClient();
    globalForPrisma.prisma = client;
    globalForPrisma.prismaReady = ready;
  }
  return globalForPrisma.prisma;
}

function getReadySignal(): Promise<void> {
  return globalForPrisma.prismaReady ?? Promise.resolve();
}

/** يلفّ كائن نموذج (prisma.user، prisma.course...) بحيث تنتظر كل استدعاء دالة تهيئة قاعدة بيانات وضع العرض أولًا. */
function wrapDelegate(delegate: Record<string, unknown>) {
  return new Proxy(delegate, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== "function") return value;
      return async (...args: unknown[]) => {
        await getReadySignal();
        return (value as (...a: unknown[]) => unknown).apply(target, args);
      };
    },
  });
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === "function") {
      return async (...args: unknown[]) => {
        await getReadySignal();
        return (value as (...a: unknown[]) => unknown).apply(client, args);
      };
    }
    if (value && typeof value === "object") {
      return wrapDelegate(value as Record<string, unknown>);
    }
    return value;
  },
});
