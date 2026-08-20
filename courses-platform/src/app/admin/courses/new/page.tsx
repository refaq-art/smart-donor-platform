import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CourseForm } from "@/components/admin/course-form";

export const metadata: Metadata = { title: "إضافة دورة جديدة" };

export default async function NewCoursePage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="page-title">إضافة دورة جديدة</h1>
      <p className="page-subtitle mb-6">املأ بيانات الدورة كاملة قبل الحفظ</p>
      <CourseForm categories={categories} />
    </div>
  );
}
