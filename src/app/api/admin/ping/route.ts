import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// نقطة تشخيص بسيطة جدًا لا تستورد أي شيء متعلق بقاعدة البيانات — تُستخدم للتأكد
// من أن الخادم نفسه يعمل بشكل سليم بمعزل عن أي مشكلة اتصال بـ Turso.
export async function GET() {
  return NextResponse.json({
    ok: true,
    time: new Date().toISOString(),
    hasTursoUrl: Boolean(process.env.TURSO_DATABASE_URL),
    hasTursoToken: Boolean(process.env.TURSO_AUTH_TOKEN),
    hasBootstrapSecret: Boolean(process.env.BOOTSTRAP_SECRET),
    hasAuthSecret: Boolean(process.env.AUTH_SECRET),
    nodeEnv: process.env.NODE_ENV,
  });
}
