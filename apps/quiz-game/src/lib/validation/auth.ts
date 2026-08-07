import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().trim().email('بريد إلكتروني غير صالح'),
  password: z.string().min(8, 'كلمة المرور يجب ألا تقل عن 8 أحرف'),
  displayName: z.string().trim().min(2, 'الاسم قصير جدًا').max(30, 'الاسم طويل جدًا'),
  avatarEmoji: z.string().optional(),
  avatarColor: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email('بريد إلكتروني غير صالح'),
  password: z.string().min(1, 'أدخل كلمة المرور'),
});

export const guestSchema = z.object({
  displayName: z.string().trim().min(2, 'الاسم قصير جدًا').max(30, 'الاسم طويل جدًا'),
  avatarEmoji: z.string().optional(),
  avatarColor: z.string().optional(),
});

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(30).optional(),
  avatarEmoji: z.string().optional(),
  avatarColor: z.string().optional(),
});
