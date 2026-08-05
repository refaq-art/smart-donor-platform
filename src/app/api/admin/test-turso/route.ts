import { NextRequest, NextResponse } from "next/server";

// نقطة تشخيص: تختبر الاتصال الخام بـ Turso عبر @libsql/client/web فقط،
// بمعزل تام عن Prisma، لعزل مصدر أي عطل. محمية بنفس BOOTSTRAP_SECRET.
export async function GET(request: NextRequest) {
  const secret = process.env.BOOTSTRAP_SECRET;
  if (!secret || request.nextUrl.searchParams.get("secret") !== secret) {
    return NextResponse.json({ error: "غير مصرَّح أو غير مُفعَّلة" }, { status: 401 });
  }

  const steps: string[] = [];
  try {
    steps.push("قبل استيراد @libsql/client/web");
    const { createClient } = await import("@libsql/client/web");
    steps.push("تم الاستيراد بنجاح");

    const url = process.env.TURSO_DATABASE_URL;
    if (!url) {
      return NextResponse.json({ ok: false, steps, error: "TURSO_DATABASE_URL غير مضبوط" });
    }

    steps.push("قبل createClient");
    const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
    steps.push("تم إنشاء العميل بنجاح");

    steps.push("قبل تنفيذ استعلام SELECT 1");
    const result = await client.execute("SELECT 1 AS ok");
    steps.push("تم تنفيذ الاستعلام بنجاح");

    return NextResponse.json({ ok: true, steps, rows: result.rows });
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
