export type CourseForStatus = {
  isPublished: boolean;
  registrationOpen: boolean;
  remainingSeats: number;
  startDate: Date | string;
  endDate: Date | string;
};

export type RegistrationState =
  | "ALREADY_ENROLLED"
  | "ENDED"
  | "FULL"
  | "CLOSED"
  | "UNPUBLISHED"
  | "OPEN";

export const REGISTRATION_STATE_LABELS: Record<RegistrationState, string> = {
  ALREADY_ENROLLED: "أنت مسجَّل في هذه الدورة",
  ENDED: "انتهت الدورة",
  FULL: "المقاعد مكتملة",
  CLOSED: "التسجيل مغلق",
  UNPUBLISHED: "الدورة غير متاحة",
  OPEN: "التسجيل مفتوح",
};

export const REGISTRATION_STATE_BADGE_CLASS: Record<RegistrationState, string> = {
  ALREADY_ENROLLED: "bg-blue-50 text-blue-700 ring-blue-200",
  ENDED: "bg-gray-100 text-gray-600 ring-gray-200",
  FULL: "bg-amber-50 text-amber-700 ring-amber-200",
  CLOSED: "bg-gray-100 text-gray-600 ring-gray-200",
  UNPUBLISHED: "bg-gray-100 text-gray-600 ring-gray-200",
  OPEN: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

/** يحسب حالة التسجيل الفعلية لدورة بالنسبة لزائر/مستخدم معيّن. */
export function getRegistrationState(
  course: CourseForStatus,
  isEnrolled: boolean,
  now: Date = new Date()
): RegistrationState {
  if (isEnrolled) return "ALREADY_ENROLLED";
  if (!course.isPublished) return "UNPUBLISHED";
  if (new Date(course.endDate) < now) return "ENDED";
  if (!course.registrationOpen) return "CLOSED";
  if (course.remainingSeats <= 0) return "FULL";
  return "OPEN";
}

export function canEnroll(state: RegistrationState): boolean {
  return state === "OPEN";
}

export type CourseTimeBucket = "UPCOMING" | "CURRENT" | "PAST";

export function getCourseTimeBucket(
  course: { startDate: Date | string; endDate: Date | string },
  now: Date = new Date()
): CourseTimeBucket {
  const start = new Date(course.startDate);
  const end = new Date(course.endDate);
  if (now < start) return "UPCOMING";
  if (now > end) return "PAST";
  return "CURRENT";
}

export const COURSE_TIME_BUCKET_LABELS: Record<CourseTimeBucket, string> = {
  UPCOMING: "دورات قادمة",
  CURRENT: "دورات حالية",
  PAST: "دورات منتهية",
};
