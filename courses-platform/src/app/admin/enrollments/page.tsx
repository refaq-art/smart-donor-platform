import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { adminCancelEnrollmentAction } from "@/app/actions/admin-enrollments";
import { ConfirmForm } from "@/components/confirm-form";
import { EmptyState } from "@/components/ui";
import { formatDateShortAr, formatNumberAr } from "@/lib/utils";

export const metadata: Metadata = { title: "إدارة التسجيلات" };

export default async function AdminEnrollmentsPage({
  searchParams,
}: {
  searchParams: { q?: string; courseId?: string; status?: string };
}) {
  const where: Prisma.EnrollmentWhereInput = {};

  if (searchParams.q) {
    where.OR = [
      { user: { fullName: { contains: searchParams.q } } },
      { user: { email: { contains: searchParams.q } } },
      { course: { title: { contains: searchParams.q } } },
    ];
  }
  if (searchParams.courseId) where.courseId = searchParams.courseId;
  if (searchParams.status) where.status = searchParams.status;

  const [enrollments, courses] = await Promise.all([
    prisma.enrollment.findMany({
      where,
      include: { user: true, course: true },
      orderBy: { enrolledAt: "desc" },
      take: 200,
    }),
    prisma.course.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">إدارة التسجيلات</h1>
        <p className="page-subtitle">{formatNumberAr(enrollments.length)} تسجيل</p>
      </div>

      <form method="get" action="/admin/enrollments" className="card mb-6 grid grid-cols-1 gap-3 p-4 sm:grid-cols-4">
        <div className="relative sm:col-span-2">
          <Search className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            name="q"
            defaultValue={searchParams.q}
            placeholder="ابحث بالمستخدم أو الدورة..."
            className="input pr-10"
          />
        </div>
        <select name="courseId" defaultValue={searchParams.courseId || ""} className="select">
          <option value="">كل الدورات</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={searchParams.status || ""} className="select">
          <option value="">كل الحالات</option>
          <option value="ACTIVE">نشط</option>
          <option value="CANCELLED">ملغى</option>
        </select>
        <div className="sm:col-span-4">
          <button type="submit" className="btn-secondary">
            تطبيق الفلاتر
          </button>
          <a href="/admin/enrollments" className="btn-ghost mr-2">
            مسح
          </a>
        </div>
      </form>

      {enrollments.length === 0 ? (
        <EmptyState title="لا توجد تسجيلات مطابقة" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[800px] text-right text-sm">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500">
              <tr>
                <th className="px-4 py-3">المستخدم</th>
                <th className="px-4 py-3">الدورة</th>
                <th className="px-4 py-3">تاريخ التسجيل</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enrollments.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3">
                    <p className="font-bold text-ink">{e.user.fullName}</p>
                    <p className="text-xs text-slate-400" dir="ltr">
                      {e.user.email}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{e.course.title}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDateShortAr(e.enrolledAt)}</td>
                  <td className="px-4 py-3">
                    {e.status === "ACTIVE" ? (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">نشط</span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
                        ملغى{e.cancelledBy === "ADMIN" ? " (بواسطة الإدارة)" : ""}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {e.status === "ACTIVE" && (
                      <ConfirmForm
                        action={adminCancelEnrollmentAction}
                        confirmMessage={`هل تريد إلغاء تسجيل "${e.user.fullName}" في دورة "${e.course.title}"؟`}
                      >
                        <input type="hidden" name="enrollmentId" value={e.id} />
                        <button type="submit" className="text-xs font-bold text-red-600 hover:underline">
                          إلغاء التسجيل
                        </button>
                      </ConfirmForm>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
