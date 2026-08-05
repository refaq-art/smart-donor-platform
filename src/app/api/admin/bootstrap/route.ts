import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@libsql/client/web";
import { prisma } from "@/lib/prisma";
import { seedDemoData } from "@/lib/seed-data";
import { TURSO_CREATE_TABLES_SQL, TURSO_MIGRATE_STATEMENTS } from "@/lib/turso-init-sql";

// نقطة تهيئة سحابية لمرة واحدة: تُنشئ جداول قاعدة بيانات Turso (إن لم تكن موجودة)
// ثم تُعبّئ البيانات التجريبية فقط إذا كانت قاعدة البيانات فارغة تمامًا — لا تلمس
// أي بيانات حقيقية موجودة. مُعطَّلة تمامًا ما لم يُضبط BOOTSTRAP_SECRET. يقبل السر
// إما عبر ترويسة x-bootstrap-secret (POST) أو معامل استعلام ?secret= (GET، لتشغيلها
// مباشرة من المتصفح دون أدوات إضافية). راجع قسم "النشر السحابي المجاني" في README.md.
async function handleBootstrap(providedSecret: string | null) {
  const secret = process.env.BOOTSTRAP_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "غير مُفعَّلة (BOOTSTRAP_SECRET غير مضبوط)" }, { status: 404 });
  }

  if (providedSecret !== secret) {
    return NextResponse.json({ error: "غير مصرَّح" }, { status: 401 });
  }

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  if (!tursoUrl) {
    return NextResponse.json({ error: "TURSO_DATABASE_URL غير مضبوط — هذه النقطة مخصصة للوضع السحابي فقط" }, { status: 400 });
  }

  try {
    const rawClient = createClient({ url: tursoUrl, authToken: process.env.TURSO_AUTH_TOKEN });

    // الخطوة 1: إنشاء أي جداول ناقصة بأحدث مخطط كامل (آمنة التكرار)
    await rawClient.executeMultiple(TURSO_CREATE_TABLES_SQL);

    // الخطوة 2: ترقية أي جداول قائمة من نشر أقدم بإضافة الأعمدة الناقصة وتعبئتها
    const migrationLog: { statement: string; result: "applied" | "already_applied" | "error" }[] = [];
    for (const statement of TURSO_MIGRATE_STATEMENTS) {
      try {
        await rawClient.execute(statement);
        migrationLog.push({ statement, result: "applied" });
      } catch (err) {
        const message = err instanceof Error ? err.message.toLowerCase() : "";
        if (message.includes("duplicate column") || message.includes("already exists")) {
          migrationLog.push({ statement, result: "already_applied" });
        } else {
          migrationLog.push({ statement, result: "error" });
        }
      }
    }

    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return NextResponse.json({
        schemaApplied: true,
        seeded: false,
        message: "الجداول موجودة والبيانات غير فارغة — تم تخطي التعبئة التجريبية.",
        migrationLog,
      });
    }

    const logs: string[] = [];
    const result = await seedDemoData(prisma, (msg) => logs.push(msg));

    return NextResponse.json({ schemaApplied: true, seeded: true, adminEmail: result.adminEmail, logs, migrationLog });
  } catch (err) {
    const message = err instanceof Error ? err.message : "خطأ غير معروف";
    const stack = err instanceof Error ? err.stack : undefined;
    return NextResponse.json({ error: message, stack }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return handleBootstrap(request.headers.get("x-bootstrap-secret"));
}

export async function GET(request: NextRequest) {
  return handleBootstrap(request.nextUrl.searchParams.get("secret"));
}
