export const ROLES = {
  USER: "USER",
  ADMIN: "ADMIN",
} as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

export const COURSE_LEVELS = {
  BEGINNER: "BEGINNER",
  INTERMEDIATE: "INTERMEDIATE",
  ADVANCED: "ADVANCED",
} as const;
export type CourseLevel = (typeof COURSE_LEVELS)[keyof typeof COURSE_LEVELS];

export const COURSE_LEVEL_LABELS: Record<CourseLevel, string> = {
  BEGINNER: "مبتدئ",
  INTERMEDIATE: "متوسط",
  ADVANCED: "متقدم",
};

export const COURSE_TYPES = {
  ONLINE: "ONLINE",
  IN_PERSON: "IN_PERSON",
} as const;
export type CourseType = (typeof COURSE_TYPES)[keyof typeof COURSE_TYPES];

export const COURSE_TYPE_LABELS: Record<CourseType, string> = {
  ONLINE: "أونلاين",
  IN_PERSON: "حضوري",
};

export const ENROLLMENT_STATUS = {
  ACTIVE: "ACTIVE",
  CANCELLED: "CANCELLED",
} as const;
export type EnrollmentStatusValue = (typeof ENROLLMENT_STATUS)[keyof typeof ENROLLMENT_STATUS];

export const COVER_COLORS = ["blue", "orange", "teal", "purple", "rose", "amber"] as const;
export type CoverColor = (typeof COVER_COLORS)[number];

export const COVER_COLOR_GRADIENTS: Record<string, string> = {
  blue: "from-blue-500 to-indigo-600",
  orange: "from-orange-400 to-rose-500",
  teal: "from-teal-400 to-emerald-600",
  purple: "from-violet-500 to-purple-700",
  rose: "from-rose-400 to-pink-600",
  amber: "from-amber-400 to-orange-600",
};

export const SESSION_COOKIE_NAME = "courses_session";

export const DEFAULT_CATEGORIES: { name: string; slug: string; icon: string }[] = [
  { name: "البرمجة", slug: "programming", icon: "code-2" },
  { name: "التصميم", slug: "design", icon: "palette" },
  { name: "التسويق", slug: "marketing", icon: "megaphone" },
  { name: "إدارة المشاريع", slug: "project-management", icon: "kanban-square" },
  { name: "اللغات", slug: "languages", icon: "languages" },
  { name: "المهارات الشخصية", slug: "soft-skills", icon: "sparkles" },
  { name: "ريادة الأعمال", slug: "entrepreneurship", icon: "rocket" },
  { name: "تحليل البيانات", slug: "data-analysis", icon: "bar-chart-3" },
];
