import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getFullReportByToken } from "@/lib/data/report";
import { ReportDocument } from "@/lib/pdf/ReportDocument";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { token: string } }
) {
  const data = await getFullReportByToken(params.token);
  if (!data) {
    return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  }

  const buffer = await renderToBuffer(ReportDocument({ data }));

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="athar-kafalatak-${data.sponsor.full_name}.pdf"`,
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "private, no-store",
    },
  });
}
