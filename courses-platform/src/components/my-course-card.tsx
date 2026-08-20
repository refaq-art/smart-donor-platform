"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { Award, CalendarDays, MapPin, Video } from "lucide-react";
import { CourseCover } from "@/components/course-cover";
import { Badge, FormMessage } from "@/components/ui";
import { cancelEnrollmentAction } from "@/app/actions/enrollments";
import { COURSE_TYPES } from "@/lib/constants";
import { formatDateAr } from "@/lib/utils";
import type { FormState } from "@/app/actions/auth";
import type { CourseTimeBucket } from "@/lib/course-status";

export type MyCourseData = {
  enrollmentId: string;
  enrolledAt: Date;
  bucket: CourseTimeBucket;
  course: {
    slug: string;
    title: string;
    shortDescription: string;
    coverImageUrl: string | null;
    coverColor: string;
    type: string;
    location: string | null;
    meetingUrl: string | null;
    startDate: Date;
    endDate: Date;
    scheduleTime: string;
    hasCertificate: boolean;
  };
};

export function MyCourseCard({ data }: { data: MyCourseData }) {
  const [state, formAction] = useFormState<FormState, FormData>(cancelEnrollmentAction, null);
  const { course } = data;

  return (
    <div className="card flex flex-col overflow-hidden sm:flex-row">
      <Link href={`/courses/${course.slug}`} className="h-40 w-full shrink-0 sm:h-auto sm:w-48">
        <CourseCover title={course.title} imageUrl={course.coverImageUrl} color={course.coverColor} />
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <Link href={`/courses/${course.slug}`} className="font-black text-ink hover:text-brand-600">
            {course.title}
          </Link>
          {course.hasCertificate && (
            <Badge className="border-amber-200 bg-amber-50 text-amber-700 ring-amber-200">
              <Award className="h-3 w-3" aria-hidden="true" />
              شهادة
            </Badge>
          )}
        </div>

        <p className="line-clamp-2 text-sm text-slate-500">{course.shortDescription}</p>

        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            {formatDateAr(course.startDate)} - {formatDateAr(course.endDate)}
          </span>
          <span className="flex items-center gap-1">
            {course.type === COURSE_TYPES.ONLINE ? (
              <Video className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {course.type === COURSE_TYPES.ONLINE ? course.meetingUrl || "أونلاين" : course.location}
          </span>
          <span>{course.scheduleTime}</span>
        </div>

        {state?.error && <FormMessage type="error" message={state.error} />}
        {state?.success ? (
          <FormMessage type="success" message={state.success} />
        ) : (
          data.bucket !== "PAST" && (
            <form
              action={formAction}
              className="mt-1"
              onSubmit={(e) => {
                if (!confirm("هل أنت متأكد من إلغاء تسجيلك في هذه الدورة؟")) {
                  e.preventDefault();
                }
              }}
            >
              <input type="hidden" name="enrollmentId" value={data.enrollmentId} />
              <button type="submit" className="text-xs font-bold text-red-600 hover:underline">
                إلغاء التسجيل
              </button>
            </form>
          )
        )}
      </div>
    </div>
  );
}
