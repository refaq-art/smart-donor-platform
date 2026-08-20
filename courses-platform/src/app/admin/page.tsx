import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, CheckCircle2, ClipboardList, Lock, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDateShortAr, formatNumberAr } from "@/lib/utils";

export const metadata: Metadata = { title: "لوحة التحكم" };

export default async function AdminDashboardPage() {
  const now = new Date();

  const [
    totalUsers,
    totalCourses,
    totalEnrollments,
    openCourses,
    completedCourses,
    recentEnrollments,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.course.count(),
    prisma.enrollment.count({ where: { status: "ACTIVE" } }),
    prisma.course.count({
      where: { isPublished: true, registrationOpen: true, remainingSeats: { gt: 0 }, endDate: { gte: now } },
    }),
    prisma.course.count({ where: { endDate: { lt: now } } }),
    prisma.enrollment.findMany({
      where: { status: "ACTIVE" },
      orderBy: { enrolledAt: "desc" },
      take: 8,
      include: { user: true, course: true },
    }),
  ]);

  const cards = [
    { label: "إجمالي المستخدمين", value: totalUsers, icon: Users, href: "/admin/users" },
    { label: "إجمالي الدورات", value: totalCourses, icon: BookOpen, href: "/admin/courses" },
    { label: "إجمالي التسجيلات", value: totalEnrollments, icon: ClipboardList, href: "/admin/enrollments" },
    { label: "الدورات المفتوحة للتسجيل", value: openCourses, icon: CheckCircle2, href: "/admin/courses?open=1" },
    { label: "الدورات المكتملة", value: completedCourses, icon: Lock, href: "/admin/courses?ended=1" },
  ];

  return (
    <div>
      <h1 className="page-title">لوحة التحكم</h1>
      <p className="page-subtitle mb-8">نظرة عامة على أداء المنصة</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="card p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
            <card.icon className="mb-3 h-6 w-6 text-brand-600" aria-hidden="true" />
            <p className="text-2xl font-black text-ink">{formatNumberAr(card.value)}</p>
            <p className="mt-1 text-xs font-bold text-slate-500">{card.label}</p>
          </Link>
        ))}
      </div>

      <div className="card mt-8 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <h2 className="font-black text-ink">أحدث التسجيلات</h2>
          <Link href="/admin/enrollments" className="text-sm font-bold text-brand-600 hover:underline">
            عرض الكل
          </Link>
        </div>
        {recentEnrollments.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-400">لا توجد تسجيلات بعد</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-xs font-bold text-slate-500">
                <tr>
                  <th className="px-5 py-3">المستخدم</th>
                  <th className="px-5 py-3">الدورة</th>
                  <th className="px-5 py-3">تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentEnrollments.map((e) => (
                  <tr key={e.id}>
                    <td className="px-5 py-3 font-bold text-ink">{e.user.fullName}</td>
                    <td className="px-5 py-3 text-slate-600">
                      <Link href={`/courses/${e.course.slug}`} className="hover:text-brand-600">
                        {e.course.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{formatDateShortAr(e.enrolledAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
