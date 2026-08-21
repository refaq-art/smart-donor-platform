import { z } from "zod";

/** يطبّع رقم الجوال السعودي إلى صيغة موحّدة (9665XXXXXXXX) بغض النظر عن شكل
 * إدخاله (05XXXXXXXX / 5XXXXXXXX / +9665XXXXXXXX...) لضمان عدم تكرار نفس
 * الرقم فعليًا بصيغتين مختلفتين. */
export function normalizeSaudiPhone(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, "");
  let normalized = digits;
  if (normalized.startsWith("00966")) normalized = normalized.slice(2);
  if (normalized.startsWith("0")) normalized = "966" + normalized.slice(1);
  if (normalized.startsWith("5") && normalized.length === 9) normalized = "966" + normalized;
  if (!/^9665\d{8}$/.test(normalized)) return null;
  return normalized;
}

export function formatSaudiPhone(normalized: string): string {
  // 966 5XXXXXXXX → 05XXXXXXXX للعرض
  const local = normalized.replace(/^966/, "0");
  return local;
}

const phoneField = z
  .string()
  .trim()
  .min(1, "رقم الجوال مطلوب")
  .refine((v) => normalizeSaudiPhone(v) !== null, "رقم جوال سعودي غير صحيح (مثال: 05XXXXXXXX)");

const passwordField = z.string().min(6, "كلمة المرور يجب ألا تقل عن 6 أحرف");

export const registerSchema = z.object({
  name: z.string().trim().min(1, "الاسم مطلوب"),
  phone: phoneField,
  password: passwordField,
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  phone: phoneField,
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const customerSchema = z.object({
  name: z.string().trim().min(1, "اسم العميل مطلوب"),
});
export type CustomerInput = z.infer<typeof customerSchema>;

const positiveAmount = z.coerce.number().positive("المبلغ يجب أن يكون أكبر من صفر");
const nonNegativeAmount = z.coerce.number().min(0, "لا يمكن أن يكون المبلغ سالبًا");
const dateField = z.coerce.date({ errorMap: () => ({ message: "تاريخ غير صحيح" }) });

export const graceTransactionSchema = z.object({
  customerId: z.string().min(1, "العميل مطلوب"),
  principal: positiveAmount,
  interest: nonNegativeAmount,
  startDate: dateField,
  months: z.coerce.number().int().min(1, "عدد الأشهر يجب أن يكون 1 على الأقل"),
  notes: z.string().trim().optional().nullable(),
});
export type GraceTransactionInput = z.infer<typeof graceTransactionSchema>;

export const installmentTransactionSchema = z.object({
  customerId: z.string().min(1, "العميل مطلوب"),
  principal: positiveAmount,
  interest: nonNegativeAmount,
  firstInstallmentDate: dateField,
  installmentsCount: z.coerce.number().int().min(1, "عدد الأقساط يجب أن يكون 1 على الأقل"),
  notes: z.string().trim().optional().nullable(),
});
export type InstallmentTransactionInput = z.infer<typeof installmentTransactionSchema>;

export const paymentSchema = z.object({
  amount: positiveAmount,
  paymentDate: dateField,
});
export type PaymentInput = z.infer<typeof paymentSchema>;

export const accountUpdateSchema = z.object({
  name: z.string().trim().min(1, "الاسم مطلوب"),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
    newPassword: passwordField,
    confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

export const adminCreateUserSchema = z.object({
  name: z.string().trim().min(1, "الاسم مطلوب"),
  phone: phoneField,
  password: passwordField,
  role: z.enum(["USER", "ADMIN"]).default("USER"),
});

export const adminUpdateUserSchema = z.object({
  name: z.string().trim().min(1, "الاسم مطلوب"),
  role: z.enum(["USER", "ADMIN"]),
});

export function firstZodError(error: z.ZodError): string {
  return error.issues[0]?.message || "بيانات غير صحيحة";
}
