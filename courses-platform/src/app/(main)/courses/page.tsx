import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { courseCardInclude, getEnrolledCourseIds } from "@/lib/queries";
import { CourseCard } from "@/components/course-card";
import { CourseFilters } from "@/components/course-filters";
import { EmptyState, Pagination } from "@/components/ui";
import { formatNumberAr } from "@/lib/utils";
import { SearchX } from "lucide-react";

export const metadata: Metadata = { title: "جميع الدورات" };

const PAGE_SIZE = 9;

type SearchParams = {
  q?: string;
  category?: string;
  level?: string;
  type?: string;
  cert?: string;
  open?: string;
  sort?: string;
  page?: string;
};

function buildWhere(params: SearchParams): Prisma.CourseWhereInput {
  const where: Prisma.CourseWhereInput = { isPublished: true };

  if (params.q) {
    const q = params.q.trim();
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { instructorName: { contains: q } },
        { shortDescription: { contains: q } },
      ];
    }
  }

  if (params.category) where.category = { slug: params.category };
  if (params.level) where.level = params.level;
  if (params.type) where.type = params.type;
  if (params.cert === "1") where.hasCertificate = true;
  if (params.open === "1") {
    where.registrationOpen = true;
    where.remainingSeats = { gt: 0 };
    where.endDate = { gte: new Date() };
  }

  return where;
}

function buildOrderBy(sort?: string): Prisma.CourseOrderByWithRelationInput {
  switch (sort) {
    case "soonest":
      return { startDate: "asc" };
    case "az":
      return { title: "asc" };
    default:
      return { createdAt: "desc" };
  }
}

export default async function CoursesPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const where = buildWhere(searchParams);
  const orderBy = buildOrderBy(searchParams.sort);

  const [courses, total, enrolledIds] = await Promise.all([
    prisma.course.findMany({
      where,
      include: courseCardInclude,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.course.count({ where }),
    getEnrolledCourseIds(session?.userId),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildHref = (targetPage: number) => {
    const sp = new URLSearchParams();
    if (searchParams.q) sp.set("q", searchParams.q);
    if (searchParams.category) sp.set("category", searchParams.category);
    if (searchParams.level) sp.set("level", searchParams.level);
    if (searchParams.type) sp.set("type", searchParams.type);
    if (searchParams.cert) sp.set("cert", searchParams.cert);
    if (searchParams.open) sp.set("open", searchParams.open);
    if (searchParams.sort) sp.set("sort", searchParams.sort);
    if (targetPage > 1) sp.set("page", String(targetPage));
    const qs = sp.toString();
    return qs ? `/courses?${qs}` : "/courses";
  };

  return (
    <div className="container-app py-10">
      <div className="mb-8">
        <h1 className="page-title">جميع الدورات</h1>
        <p className="page-subtitle">
          {formatNumberAr(total)} دورة متاحة — ابحث وصفِّ لتجد الدورة الأنسب لك
        </p>
      </div>

      <CourseFilters
        values={{
          q: searchParams.q || "",
          category: searchParams.category || "",
          level: searchParams.level || "",
          type: searchParams.type || "",
          cert: searchParams.cert || "",
          open: searchParams.open || "",
          sort: searchParams.sort || "newest",
        }}
      />

      {courses.length === 0 ? (
        <EmptyState
          icon={<SearchX className="h-7 w-7" aria-hidden="true" />}
          title="لا توجد دورات مطابقة"
          description="جرّب تعديل كلمات البحث أو إزالة بعض الفلاتر للعثور على المزيد من الدورات."
          actionLabel="مسح الفلاتر"
          actionHref="/courses"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} isEnrolled={enrolledIds.has(course.id)} />
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} buildHref={buildHref} />
        </>
      )}
    </div>
  );
}
