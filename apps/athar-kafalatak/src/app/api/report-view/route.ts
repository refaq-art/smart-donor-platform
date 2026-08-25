import { NextResponse, type NextRequest } from "next/server";
import { recordReportView } from "@/lib/data/report";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : null;
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId : null;

  if (!token || !sessionId) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  await recordReportView({
    token,
    sessionId,
    userAgent: request.headers.get("user-agent"),
    stageReached: typeof body?.stageReached === "number" ? body.stageReached : 0,
    completed: Boolean(body?.completed),
  });

  return NextResponse.json({ ok: true });
}
