import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { requireOwnedApplication, AuthzError } from "@/lib/authz";
import { parseBudgetItems } from "@/lib/utils";

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
    include: { project: true },
  });
  if (!full) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });

  const items = parseBudgetItems(full.project.budgetBreakdown);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("الميزانية", { views: [{ rightToLeft: true }] });
  sheet.columns = [
    { header: "البند", key: "item", width: 45 },
    { header: "المبلغ (ريال)", key: "amount", width: 20 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const it of items) {
    sheet.addRow({ item: it.item, amount: it.amount });
  }

  const total = items.reduce((s, it) => s + (it.amount || 0), 0);
  const totalRow = sheet.addRow({ item: "الإجمالي", amount: full.project.budgetTotal || total });
  totalRow.font = { bold: true };

  if (items.length === 0) {
    sheet.addRow({ item: "لا توجد بنود ميزانية مفصّلة على مستوى المشروع", amount: "" });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = encodeURIComponent(`ميزانية - ${full.title}.xlsx`);

  return new NextResponse(buffer as Buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${filename}`,
    },
  });
}
