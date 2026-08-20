import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Plus, Search, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { deleteCourseAction, togglePublishAction, toggleRegistrationAction } from "@/app/actions/courses";
import { ConfirmForm } from "@/components/confirm-form";
import { EmptyState, FormMessage } from "@/components/ui";
import { COURSE_LEVEL_LABELS, type CourseLevel } from "@/lib/constants";
import { formatDateShortAr, formatNumberAr } from "@/lib/utils";

export const metadata: Metadata = { title: "إدارة الدورات" };

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: { q?: string; open?: string; ended?: string; created?: string; deleted?: string };
}) {
  const where: Prisma.CourseWhereInput = {};
  if (searchParams.q) {
    where.OR = [
      { title: { contains: searchParams.q } },
      { instructorName: { contains: searchParams.q } },
    ];
  }
  if (searchParams.open === "1") {
    where.isPublished = true;
    where.registrationOpen = true;
    where.remainingSeats = { gt: 0 };
    where.endDate = { gte: new Date() };
  }
  if (searchParams.ended === "1") {
    where.endDate = { lt: new Date() };
  }

  const courses = await prisma.course.findMany({
    where,
    include: { category: true, _count: { select: { enrollments: { where: { status: "ACTIVE" } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title">إدارة الدورات</h1>
          <p className="page-subtitle">{formatNumberAr(courses.length)} دورة</p>
        </div>
        <Link href="/admin/courses/new" className="btn-primary">
          <Plus className="h-4 w-4" aria-hidden="true" />
          إضافة دورة جديدة
        </Link>
      </div>

      {searchParams.created === "1" && <FormMessage type="success" message="تم إنشاء الدورة بنجاح." />}
      {searchParams.deleted === "1" && <FormMessage type="success" message="تم حذف الدورة بنجاح." />}

      <form method="get" action="/admin/courses" className="card mb-6 flex items-center gap-3 p-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            name="q"
            defaultValue={searchParams.q}
            placeholder="ابحث باسم الدورة أو المدرب..."
            className="input pr-10"
          />
        </div>
        <button type="submit" className="btn-secondary">
          بحث
        </button>
      </form>

      {courses.length === 0 ? (
        <EmptyState title="لا توجد دورات" description="ابدأ بإضافة أول دورة على المنصة." actionLabel="إضافة دورة" actionHref="/admin/courses/new" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[900px] text-right text-sm">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500">
              <tr>
                <th className="px-4 py-3">الدورة</th>
                <th className="px-4 py-3">التصنيف / المستوى</th>
                <th className="px-4 py-3">التواريخ</th>
                <th className="px-4 py-3">المقاعد</th>
                <th className="px-4 py-3">النشر</th>
                <th className="px-4 py-3">التسجيل</th>
                <th className="px-4 py-3">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses.map((course) => (
                <tr key={course.id}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/courses/${course.id}/edit`} className="font-bold text-ink hover:text-brand-600">
                      {course.title}
                    </Link>
                    <p className="text-xs text-slate-400">{course.instructorName}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {course.category.name}
                    <p className="text-xs text-slate-400">{COURSE_LEVEL_LABELS[course.level as CourseLevel]}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {formatDateShortAr(course.startDate)} - {formatDateShortAr(course.endDate)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {formatNumberAr(course._count.enrollments)} / {formatNumberAr(course.totalSeats)}
                  </td>
                  <td className="px-4 py-3">
                    <form action={togglePublishAction}>
                      <input type="hidden" name="courseId" value={course.id} />
                      <button
                        type="submit"
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          course.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {course.isPublished ? "منشورة" : "مخفية"}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <form action={toggleRegistrationAction}>
                      <input type="hidden" name="courseId" value={course.id} />
                      <button
                        type="submit"
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          course.registrationOpen ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {course.registrationOpen ? "مفتوح" : "مغلق"}
                      </button>
                    </form>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/admin/courses/${course.id}/edit`} className="text-xs font-bold text-brand-600 hover:underline">
                        تعديل
                      </Link>
                      <ConfirmForm
                        action={deleteCourseAction}
                        confirmMessage={`هل أنت متأكد من حذف دورة "${course.title}"؟ لا يمكن التراجع عن هذا الإجراء.`}
                      >
                        <input type="hidden" name="courseId" value={course.id} />
                        <button type="submit" className="flex items-center gap-1 text-xs font-bold text-red-600 hover:underline">
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          حذف
                        </button>
                      </ConfirmForm>
                    </div>
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
