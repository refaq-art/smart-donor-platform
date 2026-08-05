import { NextRequest, NextResponse } from "next/server";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { prisma } from "@/lib/prisma";
import { requireOwnedApplication, AuthzError } from "@/lib/authz";
import { FIELD_KEYS, FIELD_LABELS } from "@/lib/application-fields";
import { formatDate } from "@/lib/utils";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let application;
  try {
    ({ application } = await requireOwnedApplication(id));
  } catch (e) {
    const status = e instanceof AuthzError ? 404 : 401;
    return NextResponse.json({ error: e instanceof Error ? e.message : "غير مصرَّح" }, { status });
  }

  const full = await prisma.grantApplication.findUnique({
    where: { id },
    include: { project: true, opportunity: { include: { donor: true } }, organization: true },
  });
  if (!full) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });

  const rtl = (children: import("docx").ParagraphChild[], options: Partial<import("docx").IParagraphOptions> = {}) =>
    new Paragraph({ children, bidirectional: true, alignment: AlignmentType.RIGHT, ...options });

  const sections: Paragraph[] = [
    rtl([new TextRun({ text: full.title, bold: true, size: 36 })], { heading: HeadingLevel.TITLE, spacing: { after: 200 } }),
    rtl([
      new TextRun({ text: `${full.organization.name} — المشروع: ${full.project.title}`, size: 22, color: "555555" }),
    ]),
    rtl([
      new TextRun({
        text: `الجهة المانحة: ${full.opportunity?.donor?.name || full.opportunity?.donorNameFreeText || "غير محدد"} — تاريخ التصدير: ${formatDate(new Date())}`,
        size: 20,
        color: "888888",
      }),
    ], { spacing: { after: 300 } }),
  ];

  for (const key of FIELD_KEYS) {
    const value = full[key];
    if (!value) continue;
    sections.push(
      rtl([new TextRun({ text: FIELD_LABELS[key], bold: true, size: 26 })], {
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 120 },
      })
    );
    for (const line of value.split("\n")) {
      sections.push(rtl([new TextRun({ text: line || " ", size: 22 })], { spacing: { after: 80 } }));
    }
  }

  const doc = new Document({
    sections: [{ properties: {}, children: sections }],
  });

  const buffer = await Packer.toBuffer(doc);
  const filename = encodeURIComponent(`${full.title}.docx`);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename*=UTF-8''${filename}`,
    },
  });
}
