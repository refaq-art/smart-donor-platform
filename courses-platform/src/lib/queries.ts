import { prisma } from "@/lib/prisma";

export const courseCardInclude = {
  category: { select: { name: true, icon: true } },
} as const;

/** يُعيد مجموعة معرّفات الدورات التي لدى المستخدم تسجيل نشط فيها، لعرض شارة "مسجَّل مسبقًا". */
export async function getEnrolledCourseIds(userId?: string | null): Promise<Set<string>> {
  if (!userId) return new Set();
  const enrollments = await prisma.enrollment.findMany({
    where: { userId, status: "ACTIVE" },
    select: { courseId: true },
  });
  return new Set(enrollments.map((e) => e.courseId));
}

export async function getPlatformStats() {
  const [totalCourses, totalLearners, totalCategories, certificateCourses, totalEnrollments] =
    await Promise.all([
      prisma.course.count({ where: { isPublished: true } }),
      prisma.user.count({ where: { role: "USER" } }),
      prisma.category.count(),
      prisma.course.count({ where: { isPublished: true, hasCertificate: true } }),
      prisma.enrollment.count({ where: { status: "ACTIVE" } }),
    ]);

  return { totalCourses, totalLearners, totalCategories, certificateCourses, totalEnrollments };
}

export async function getCategoriesWithCounts() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { courses: { where: { isPublished: true } } } },
    },
  });
  return categories;
}
