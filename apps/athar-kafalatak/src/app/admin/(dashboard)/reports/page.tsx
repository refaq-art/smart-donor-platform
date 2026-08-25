import Link from "next/link";
import { Plus, Search, Pencil, Eye } from "lucide-react";
import { listReports } from "@/lib/data/admin";
import { deleteReport } from "@/app/actions/reports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { CopyLinkButton } from "@/components/admin/CopyLinkButton";
import { formatCurrency, statusLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, "default" | "gold" | "success" | "warning"> = {
  draft: "default",
  ready: "warning",
  sent: "gold",
  viewed: "success",
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const reports = await listReports(searchParams.q);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-forest-900">تقارير الأثر</h1>
        <Link href="/admin/reports/new">
          <Button>
            <Plus className="h-4 w-4" />
            إنشاء تقرير أثر جديد
          </Button>
        </Link>
      </div>

      <form className="relative mb-5 max-w-sm">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-forest-300" />
        <Input name="q" defaultValue={searchParams.q} placeholder="ابحث باسم الكافل أو عنوان التقرير" className="pr-9" />
      </form>

      <div className="overflow-hidden rounded-xl2 border border-forest-100 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-forest-50 text-forest-500">
            <tr>
              <th className="p-4 text-right font-semibold">الكافل</th>
              <th className="p-4 text-right font-semibold">العنوان</th>
              <th className="p-4 text-right font-semibold">إجمالي الدعم</th>
              <th className="p-4 text-right font-semibold">الحالة</th>
              <th className="p-4 text-right font-semibold">الزيارات</th>
              <th className="p-4 text-right font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-forest-400">
                  لا توجد تقارير بعد.
                </td>
              </tr>
            ) : (
              reports.map((r) => (
                <tr key={r.id} className="border-t border-forest-50">
                  <td className="p-4 font-semibold text-forest-800">{r.sponsor_name}</td>
                  <td className="p-4 text-forest-600">{r.title}</td>
                  <td className="p-4 text-forest-600">{formatCurrency(r.total_support)}</td>
                  <td className="p-4">
                    <Badge variant={STATUS_VARIANT[r.status]}>{statusLabel(r.status)}</Badge>
                  </td>
                  <td className="p-4 text-forest-500">{r.view_count}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={`/report/${r.report_token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg p-2 text-forest-500 hover:bg-forest-50"
                        aria-label="معاينة"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                      <CopyLinkButton token={r.report_token} />
                      <Link
                        href={`/admin/reports/${r.id}/edit`}
                        className="rounded-lg p-2 text-forest-500 hover:bg-forest-50"
                        aria-label="تعديل"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <DeleteButton
                        action={deleteReport.bind(null, r.id)}
                        confirmMessage={`هل تريد حذف تقرير "${r.title}"؟`}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
