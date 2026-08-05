import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// نقطة تشخيص: تستورد Prisma ديناميكيًا داخل try/catch لالتقاط أي خطأ يحدث أثناء
// التحميل نفسه (وهو ما تعجز نقاط أخرى عن التقاطه لأن الاستيراد الثابت يفشل قبل
// تنفيذ أي كود داخلها). محمية بنفس BOOTSTRAP_SECRET.
export async function GET(request: NextRequest) {
  const secret = process.env.BOOTSTRAP_SECRET;
  if (!secret || request.nextUrl.searchParams.get("secret") !== secret) {
    return NextResponse.json({ error: "غير مصرَّح أو غير مُفعَّلة" }, { status: 401 });
  }

  const steps: string[] = [];
  try {
    steps.push("قبل استيراد @prisma/client");
    const { PrismaClient } = await import("@prisma/client");
    steps.push("تم استيراد @prisma/client");

    steps.push("قبل استيراد @prisma/adapter-libsql");
    const { PrismaLibSQL } = await import("@prisma/adapter-libsql");
    steps.push("تم استيراد المهايئ");

    steps.push("قبل استيراد @libsql/client/web");
    const { createClient } = await import("@libsql/client/web");
    steps.push("تم استيراد عميل libsql");

    const url = process.env.TURSO_DATABASE_URL;
    if (!url) return NextResponse.json({ ok: false, steps, error: "TURSO_DATABASE_URL غير مضبوط" });

    steps.push("قبل إنشاء PrismaClient");
    const libsql = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
    const prisma = new PrismaClient({ adapter: new PrismaLibSQL(libsql) });
    steps.push("تم إنشاء PrismaClient");

    steps.push("قبل استعلام user.count()");
    const count = await prisma.user.count();
    steps.push("نجح الاستعلام");

    return NextResponse.json({ ok: true, steps, userCount: count });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      steps,
      errorName: err instanceof Error ? err.name : typeof err,
      errorMessage: err instanceof Error ? err.message : String(err),
      errorStack: err instanceof Error ? err.stack : undefined,
    });
  }
}
