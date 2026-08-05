import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// نقطة تشخيص بسيطة لا تستورد أي شيء متعلق بقاعدة البيانات — للتأكد من أن الخادم
// نفسه يعمل بمعزل عن أي مشكلة اتصال. محمية بـ BOOTSTRAP_SECRET لأنها تكشف عن
// حالة ضبط متغيرات البيئة (وجودها من عدمه).
export async function GET(request: NextRequest) {
  const secret = process.env.BOOTSTRAP_SECRET;
  if (!secret || request.nextUrl.searchParams.get("secret") !== secret) {
    return NextResponse.json({ error: "غير مصرَّح أو غير مُفعَّلة" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    time: new Date().toISOString(),
    hasTursoUrl: Boolean(process.env.TURSO_DATABASE_URL),
    hasTursoToken: Boolean(process.env.TURSO_AUTH_TOKEN),
    hasBlobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    hasAuthSecret: Boolean(process.env.AUTH_SECRET),
    nodeEnv: process.env.NODE_ENV,
  });
}
