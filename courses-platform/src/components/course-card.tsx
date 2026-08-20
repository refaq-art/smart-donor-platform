import Link from "next/link";
import { CourseCover } from "@/components/course-cover";
import { Badge } from "@/components/ui";
import { CategoryIcon } from "@/components/icons";
import {
  COURSE_LEVEL_LABELS,
  COURSE_TYPE_LABELS,
  type CourseLevel,
  type CourseType,
} from "@/lib/constants";
import {
  getRegistrationState,
  REGISTRATION_STATE_BADGE_CLASS,
  REGISTRATION_STATE_LABELS,
} from "@/lib/course-status";
import { formatDateShortAr, truncate } from "@/lib/utils";
import { Award, CalendarDays, MapPin, Users, Video } from "lucide-react";

export type CourseCardData = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  coverImageUrl: string | null;
  coverColor: string;
  level: string;
  type: string;
  startDate: Date;
  endDate: Date;
  scheduleTime: string;
  totalSeats: number;
  remainingSeats: number;
  hasCertificate: boolean;
  isPublished: boolean;
  registrationOpen: boolean;
  location: string | null;
  category: { name: string; icon: string };
};

export function CourseCard({
  course,
  isEnrolled = false,
}: {
  course: CourseCardData;
  isEnrolled?: boolean;
}) {
  const state = getRegistrationState(course, isEnrolled);

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
    >
      <div className="relative h-40 w-full overflow-hidden bg-slate-100">
        <CourseCover title={course.title} imageUrl={course.coverImageUrl} color={course.coverColor} />
        {course.hasCertificate && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-amber-700 shadow-sm">
            <Award className="h-3.5 w-3.5" aria-hidden="true" />
            شهادة حضور
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-1.5 text-xs font-bold text-brand-600">
          <CategoryIcon icon={course.category.icon} className="h-4 w-4" />
          {course.category.name}
        </div>

        <h3 className="line-clamp-2 text-base font-black leading-snug text-ink">{course.title}</h3>
        <p className="line-clamp-2 text-sm text-slate-500">{truncate(course.shortDescription, 110)}</p>

        <div className="flex flex-wrap gap-1.5 pt-1">
          <Badge className="border-slate-200 bg-slate-50 text-slate-600 ring-slate-200">
            {COURSE_LEVEL_LABELS[course.level as CourseLevel] ?? course.level}
          </Badge>
          <Badge className="border-slate-200 bg-slate-50 text-slate-600 ring-slate-200">
            {course.type === "ONLINE" ? (
              <Video className="h-3 w-3" aria-hidden="true" />
            ) : (
              <MapPin className="h-3 w-3" aria-hidden="true" />
            )}
            {COURSE_TYPE_LABELS[course.type as CourseType] ?? course.type}
          </Badge>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            {formatDateShortAr(course.startDate)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {course.remainingSeats} / {course.totalSeats} مقعد
          </span>
        </div>

        <Badge className={REGISTRATION_STATE_BADGE_CLASS[state]}>
          {REGISTRATION_STATE_LABELS[state]}
        </Badge>
      </div>
    </Link>
  );
}
