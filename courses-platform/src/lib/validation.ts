import { z } from "zod";
import { COURSE_LEVELS, COURSE_TYPES } from "@/lib/constants";

const nameSchema = z
  .string()
  .trim()
  .min(3, "الاسم الكامل يجب أن يتكوّن من 3 أحرف على الأقل")
  .max(80, "الاسم الكامل طويل جدًا");

const emailSchema = z
  .string()
  .trim()
  .min(1, "البريد الإلكتروني مطلوب")
  .email("صيغة البريد الإلكتروني غير صحيحة")
  .max(160)
  .toLowerCase();

const passwordSchema = z
  .string()
  .min(8, "كلمة المرور يجب أن تتكوّن من 8 أحرف على الأقل")
  .max(72, "كلمة المرور طويلة جدًا");

const phoneSchema = z
  .string()
  .trim()
  .regex(/^[0-9+\-\s]{7,20}$/, "رقم الجوال غير صحيح")
  .optional()
  .or(z.literal(""));

export const registerSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

export const updateProfileSchema = z.object({
  fullName: nameSchema,
  phone: phoneSchema,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "كلمتا المرور الجديدتان غير متطابقتين",
    path: ["confirmPassword"],
  });

export const courseSchema = z
  .object({
    title: z.string().trim().min(3, "عنوان الدورة قصير جدًا").max(150),
    shortDescription: z.string().trim().min(10, "الوصف المختصر قصير جدًا").max(240),
    description: z.string().trim().min(20, "الوصف التفصيلي قصير جدًا").max(8000),
    instructorName: z.string().trim().min(2, "اسم المدرب مطلوب").max(100),
    providerName: z.string().trim().min(2, "اسم الجهة المقدمة مطلوب").max(100),
    categoryId: z.string().min(1, "التصنيف مطلوب"),
    level: z.enum([COURSE_LEVELS.BEGINNER, COURSE_LEVELS.INTERMEDIATE, COURSE_LEVELS.ADVANCED]),
    type: z.enum([COURSE_TYPES.ONLINE, COURSE_TYPES.IN_PERSON]),
    location: z.string().trim().max(200).optional().or(z.literal("")),
    meetingUrl: z.string().trim().max(500).optional().or(z.literal("")),
    startDate: z.string().min(1, "تاريخ البداية مطلوب"),
    endDate: z.string().min(1, "تاريخ النهاية مطلوب"),
    scheduleTime: z.string().trim().min(2, "وقت الدورة مطلوب").max(120),
    durationText: z.string().trim().min(1, "مدة الدورة مطلوبة").max(60),
    totalSeats: z.coerce.number().int().min(1, "عدد المقاعد يجب أن يكون 1 على الأقل").max(100000),
    hasCertificate: z.coerce.boolean(),
    coverImageUrl: z.string().trim().max(2000).optional().or(z.literal("")),
    coverColor: z.string().min(1),
    isPublished: z.coerce.boolean(),
    registrationOpen: z.coerce.boolean(),
    isFeatured: z.coerce.boolean(),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية",
    path: ["endDate"],
  })
  .refine((data) => data.type !== COURSE_TYPES.IN_PERSON || !!data.location, {
    message: "الموقع مطلوب للدورات الحضورية",
    path: ["location"],
  })
  .refine((data) => data.type !== COURSE_TYPES.ONLINE || !!data.meetingUrl, {
    message: "رابط الحضور مطلوب للدورات الأونلاين",
    path: ["meetingUrl"],
  });
export type CourseInput = z.infer<typeof courseSchema>;

export function firstErrorMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "البيانات المدخلة غير صحيحة";
}
