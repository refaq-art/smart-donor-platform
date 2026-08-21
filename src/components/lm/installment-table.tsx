import { formatSAR } from "@/lib/lm/money";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "./ui";
import type { LmStatus } from "@/lib/lm/status";

type Row = {
  id: string;
  number: number;
  dueDate: Date;
  amount: number;
  paidAmount: number;
  remaining: number;
  status: LmStatus;
};

/** جدول الأقساط — عرض جدول حقيقي على الشاشات المتوسطة فأكبر، وبطاقات مكدَّسة
 * على الجوال بدل جدول عريض غير مناسب للشاشات الصغيرة. */
export function InstallmentTable({ rows }: { rows: Row[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 sm:block">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-slate-50 text-right text-xs font-bold text-slate-500">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">تاريخ الاستحقاق</th>
              <th className="px-4 py-3">قيمة القسط</th>
              <th className="px-4 py-3">المدفوع</th>
              <th className="px-4 py-3">المتبقي</th>
              <th className="px-4 py-3">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-bold text-slate-700">{r.number}</td>
                <td className="px-4 py-3 text-slate-600">{formatDate(r.dueDate)}</td>
                <td className="px-4 py-3 font-bold text-slate-900">{formatSAR(r.amount)}</td>
                <td className="px-4 py-3 text-emerald-700">{formatSAR(r.paidAmount)}</td>
                <td className="px-4 py-3 font-bold text-slate-900">{formatSAR(r.remaining)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 sm:hidden">
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="font-black text-slate-900">القسط {r.number}</p>
              <StatusBadge status={r.status} />
            </div>
            <p className="mt-1 text-xs text-slate-400">استحقاق {formatDate(r.dueDate)}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <p className="text-slate-400">القيمة</p>
                <p className="font-bold text-slate-900">{formatSAR(r.amount)}</p>
              </div>
              <div>
                <p className="text-slate-400">المدفوع</p>
                <p className="font-bold text-emerald-700">{formatSAR(r.paidAmount)}</p>
              </div>
              <div>
                <p className="text-slate-400">المتبقي</p>
                <p className="font-bold text-slate-900">{formatSAR(r.remaining)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
