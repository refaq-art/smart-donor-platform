import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { CourseForm } from "@/components/admin/course-form";
import { FormMessage } from "@/components/ui";

export const metadata: Metadata = { title: "تعديل الدورة" };

export default async function EditCoursePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { created?: string };
}) {
  const [course, categories] = await Promise.all([
    prisma.course.findUnique({ where: { id: params.id } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!course) notFound();

  return (
    <div>
      <h1 className="page-title">تعديل الدورة</h1>
      <p className="page-subtitle mb-6">{course.title}</p>

      {searchParams.created === "1" && (
        <FormMessage type="success" message="تم إنشاء الدورة بنجاح، يمكنك مراجعة التفاصيل وتعديلها هنا." />
      )}

      <CourseForm
        categories={categories}
        initialValues={{
          id: course.id,
          title: course.title,
          shortDescription: course.shortDescription,
          description: course.description,
          instructorName: course.instructorName,
          providerName: course.providerName,
          categoryId: course.categoryId,
          level: course.level,
          type: course.type,
          location: course.location || "",
          meetingUrl: course.meetingUrl || "",
          startDate: format(course.startDate, "yyyy-MM-dd"),
          endDate: format(course.endDate, "yyyy-MM-dd"),
          scheduleTime: course.scheduleTime,
          durationText: course.durationText,
          totalSeats: course.totalSeats,
          hasCertificate: course.hasCertificate,
          coverImageUrl: course.coverImageUrl || "",
          coverColor: course.coverColor,
          isPublished: course.isPublished,
          registrationOpen: course.registrationOpen,
          isFeatured: course.isFeatured,
        }}
      />
    </div>
  );
}
