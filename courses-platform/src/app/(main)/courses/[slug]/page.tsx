import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Award,
  BadgeCheck,
  CalendarDays,
  Clock,
  Layers,
  MapPin,
  Users,
  Video,
  Building2,
  UserRound,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { CourseCover } from "@/components/course-cover";
import { EnrollButton } from "@/components/enroll-button";
import { Badge } from "@/components/ui";
import { CategoryIcon } from "@/components/icons";
import {
  COURSE_LEVEL_LABELS,
  COURSE_TYPE_LABELS,
  COURSE_TYPES,
  type CourseLevel,
  type CourseType,
} from "@/lib/constants";
import {
  getRegistrationState,
  REGISTRATION_STATE_BADGE_CLASS,
  REGISTRATION_STATE_LABELS,
} from "@/lib/course-status";
import { formatDateAr, formatNumberAr, truncate } from "@/lib/utils";
import { ROLES } from "@/lib/constants";

async function getCourse(slug: string) {
  return prisma.course.findUnique({
    where: { slug },
    include: { category: true },
  });
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const course = await getCourse(params.slug);
  if (!course) return { title: "الدورة غير موجودة" };
  return {
    title: course.title,
    description: truncate(course.shortDescription, 160),
    openGraph: { title: course.title, description: truncate(course.shortDescription, 160) },
  };
}

export default async function CourseDetailPage({ params }: { params: { slug: string } }) {
  const session = await getSession();
  const course = await getCourse(params.slug);

  if (!course) notFound();
  if (!course.isPublished && session?.role !== ROLES.ADMIN) notFound();

  const enrollment = session
    ? await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: session.userId, courseId: course.id } },
      })
    : null;

  const isEnrolled = enrollment?.status === "ACTIVE";
  const state = getRegistrationState(course, isEnrolled);

  const seatsPercent = Math.round(
    ((course.totalSeats - course.remainingSeats) / Math.max(1, course.totalSeats)) * 100
  );

  const details = [
    { icon: UserRound, label: "المدرب", value: course.instructorName },
    { icon: Building2, label: "الجهة المقدمة", value: course.providerName },
    { icon: CalendarDays, label: "تاريخ البداية", value: formatDateAr(course.startDate) },
    { icon: CalendarDays, label: "تاريخ النهاية", value: formatDateAr(course.endDate) },
    { icon: Clock, label: "وقت الدورة", value: course.scheduleTime },
    { icon: Clock, label: "مدة الدورة", value: course.durationText },
    {
      icon: course.type === COURSE_TYPES.ONLINE ? Video : MapPin,
      label: course.type === COURSE_TYPES.ONLINE ? "طريقة الحضور" : "مكان الدورة",
      value:
        course.type === COURSE_TYPES.ONLINE
          ? isEnrolled && course.meetingUrl
            ? course.meetingUrl
            : "أونلاين — يُرسل رابط الحضور بعد التسجيل"
          : course.location || "—",
    },
    { icon: Layers, label: "التصنيف", value: course.category.name },
    { icon: BadgeCheck, label: "المستوى", value: COURSE_LEVEL_LABELS[course.level as CourseLevel] },
  ];

  return (
    <div className="container-app py-10">
      <nav aria-label="مسار التصفح" className="mb-4 text-sm text-slate-500">
        <Link href="/courses" className="hover:text-brand-600">
          الدورات
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-slate-400">{course.category.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-5 h-64 overflow-hidden rounded-xl2 sm:h-80">
            <CourseCover title={course.title} imageUrl={course.coverImageUrl} color={course.coverColor} />
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge className="border-brand-200 bg-brand-50 text-brand-700 ring-brand-200">
              <CategoryIcon icon={course.category.icon} className="h-3.5 w-3.5" />
              {course.category.name}
            </Badge>
            <Badge className="border-slate-200 bg-slate-50 text-slate-600 ring-slate-200">
              {COURSE_LEVEL_LABELS[course.level as CourseLevel]}
            </Badge>
            <Badge className="border-slate-200 bg-slate-50 text-slate-600 ring-slate-200">
              {COURSE_TYPE_LABELS[course.type as CourseType]}
            </Badge>
            {course.hasCertificate && (
              <Badge className="border-amber-200 bg-amber-50 text-amber-700 ring-amber-200">
                <Award className="h-3.5 w-3.5" aria-hidden="true" />
                شهادة حضور
              </Badge>
            )}
            {!course.isPublished && (
              <Badge className="border-red-200 bg-red-50 text-red-700 ring-red-200">
                غير منشورة (معاينة إدارية)
              </Badge>
            )}
          </div>

          <h1 className="text-2xl font-black text-ink sm:text-3xl">{course.title}</h1>
          <p className="mt-3 text-lg text-slate-600">{course.shortDescription}</p>

          <div className="prose prose-slate mt-8 max-w-none">
            <h2 className="text-lg font-black text-ink">عن الدورة</h2>
            <p className="whitespace-pre-line leading-relaxed text-slate-600">{course.description}</p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {details.map((d) => (
              <div key={d.label} className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <d.icon className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-400">{d.label}</p>
                  <p className="truncate text-sm font-bold text-ink" title={d.value}>
                    {d.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="card space-y-5 p-6">
            <Badge className={`${REGISTRATION_STATE_BADGE_CLASS[state]} w-full justify-center py-2 text-sm`}>
              {REGISTRATION_STATE_LABELS[state]}
            </Badge>

            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm font-bold">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <Users className="h-4 w-4" aria-hidden="true" />
                  المقاعد المتبقية
                </span>
                <span className="text-ink">
                  {formatNumberAr(course.remainingSeats)} من {formatNumberAr(course.totalSeats)}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand-600 transition-all"
                  style={{ width: `${seatsPercent}%` }}
                />
              </div>
            </div>

            <EnrollButton
              courseId={course.id}
              enrollmentId={enrollment?.id}
              state={state}
              isLoggedIn={!!session}
              loginNext={`/courses/${course.slug}`}
            />

            <p className="text-center text-xs text-slate-400">
              لا يمكن التسجيل في نفس الدورة أكثر من مرة واحدة
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
