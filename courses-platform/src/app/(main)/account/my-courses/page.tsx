import type { Metadata } from "next";
import { CalendarSearch } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { MyCourseCard } from "@/components/my-course-card";
import { EmptyState } from "@/components/ui";
import { getCourseTimeBucket, COURSE_TIME_BUCKET_LABELS, type CourseTimeBucket } from "@/lib/course-status";

export const metadata: Metadata = { title: "دوراتي" };

export default async function MyCoursesPage() {
  const user = await requireUser("/account/my-courses");

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id, status: "ACTIVE" },
    include: { course: true },
    orderBy: { course: { startDate: "asc" } },
  });

  if (enrollments.length === 0) {
    return (
      <EmptyState
        icon={<CalendarSearch className="h-7 w-7" aria-hidden="true" />}
        title="لم تسجَّل في أي دورة بعد"
        description="تصفّح الدورات المتاحة وابدأ رحلتك التعليمية الآن."
        actionLabel="استعرض الدورات"
        actionHref="/courses"
      />
    );
  }

  const buckets: Record<CourseTimeBucket, typeof enrollments> = {
    UPCOMING: [],
    CURRENT: [],
    PAST: [],
  };

  for (const enrollment of enrollments) {
    buckets[getCourseTimeBucket(enrollment.course)].push(enrollment);
  }

  const order: CourseTimeBucket[] = ["CURRENT", "UPCOMING", "PAST"];

  return (
    <div className="space-y-10">
      {order.map((bucket) =>
        buckets[bucket].length > 0 ? (
          <section key={bucket}>
            <h2 className="mb-4 text-lg font-black text-ink">
              {COURSE_TIME_BUCKET_LABELS[bucket]}
              <span className="mr-2 text-sm font-normal text-slate-400">
                ({buckets[bucket].length})
              </span>
            </h2>
            <div className="space-y-4">
              {buckets[bucket].map((enrollment) => (
                <MyCourseCard
                  key={enrollment.id}
                  data={{
                    enrollmentId: enrollment.id,
                    enrolledAt: enrollment.enrolledAt,
                    bucket,
                    course: enrollment.course,
                  }}
                />
              ))}
            </div>
          </section>
        ) : null
      )}
    </div>
  );
}
