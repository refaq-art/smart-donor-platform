import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import { prisma } from "@/lib/prisma";
import { seedDemoData } from "@/lib/seed-data";
import { TURSO_INIT_SQL } from "@/lib/turso-init-sql";

// نقطة تهيئة سحابية لمرة واحدة: تُنشئ جداول قاعدة بيانات Turso (إن لم تكن موجودة)
// ثم تُعبّئ البيانات التجريبية فقط إذا كانت قاعدة البيانات فارغة تمامًا — لا تلمس
// أي بيانات حقيقية موجودة. مُعطَّلة تمامًا ما لم يُضبط BOOTSTRAP_SECRET، وتتطلب
// تمرير نفس القيمة في ترويسة x-bootstrap-secret. راجع قسم "النشر السحابي المجاني"
// في README.md.
export async function POST(request: NextRequest) {
  const secret = process.env.BOOTSTRAP_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "غير مُفعَّلة (BOOTSTRAP_SECRET غير مضبوط)" }, { status: 404 });
  }

  if (request.headers.get("x-bootstrap-secret") !== secret) {
    return NextResponse.json({ error: "غير مصرَّح" }, { status: 401 });
  }

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  if (!tursoUrl) {
    return NextResponse.json({ error: "TURSO_DATABASE_URL غير مضبوط — هذه النقطة مخصصة للوضع السحابي فقط" }, { status: 400 });
  }

  try {
    const rawClient = createClient({ url: tursoUrl, authToken: process.env.TURSO_AUTH_TOKEN });
    await rawClient.executeMultiple(TURSO_INIT_SQL);

    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return NextResponse.json({ schemaApplied: true, seeded: false, message: "الجداول موجودة والبيانات غير فارغة — تم تخطي التعبئة التجريبية." });
    }

    const logs: string[] = [];
    const result = await seedDemoData(prisma, (msg) => logs.push(msg));

    return NextResponse.json({ schemaApplied: true, seeded: true, adminEmail: result.adminEmail, logs });
  } catch (err) {
    const message = err instanceof Error ? err.message : "خطأ غير معروف";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
