import { NextRequest, NextResponse } from "next/server";
import { runDonorDiscoveryForAllOrgs } from "@/lib/donor-discovery";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// تُستدعى يوميًا عبر Vercel Cron (راجع vercel.json). Vercel يضيف تلقائيًا ترويسة
// Authorization: Bearer <CRON_SECRET> عند استدعاء المهمة إن كان المتغير مضبوطًا —
// نتحقق منها هنا لمنع أي استدعاء خارجي لهذه النقطة.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "غير مُفعَّلة (CRON_SECRET غير مضبوط)" }, { status: 404 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "غير مصرَّح" }, { status: 401 });
  }

  try {
    const results = await runDonorDiscoveryForAllOrgs();
    const totalCreated = results.reduce((s, r) => s + r.created, 0);
    return NextResponse.json({ ok: true, totalCreated, results });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "خطأ غير معروف" },
      { status: 500 }
    );
  }
}
