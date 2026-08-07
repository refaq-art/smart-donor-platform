import { z } from 'zod';
import { DIFFICULTIES } from './game';

export const QUESTION_TYPES = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'WORD_GUESS', 'CHARACTER_GUESS', 'ORDERING', 'IMAGE_CHOICE'] as const;

export const answerInputSchema = z.object({
  textAr: z.string().trim().min(1, 'نص الإجابة مطلوب'),
  imageUrl: z.string().url().optional().nullable(),
  isCorrect: z.boolean().default(false),
  orderIndex: z.number().int().optional().nullable(),
});

export const questionInputSchema = z
  .object({
    categoryId: z.string().min(1, 'اختر تصنيفًا'),
    type: z.enum(QUESTION_TYPES),
    difficulty: z.enum(DIFFICULTIES),
    textAr: z.string().trim().min(3, 'نص السؤال قصير جدًا'),
    imageUrl: z.string().url().optional().nullable().or(z.literal('')),
    explanationAr: z.string().trim().optional().nullable().or(z.literal('')),
    timeLimitSeconds: z.number().int().min(5).max(120).default(20),
    basePoints: z.number().int().min(100).max(5000).default(1000),
    status: z.enum(['ACTIVE', 'DISABLED']).default('ACTIVE'),
    answers: z.array(answerInputSchema).min(1, 'أضف إجابة واحدة على الأقل'),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'WORD_GUESS' || data.type === 'CHARACTER_GUESS') {
      if (data.answers.some((a) => !a.isCorrect)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'كل الإجابات المقبولة في هذا النوع تُعتبر صحيحة' });
      }
      return;
    }
    if (data.type === 'ORDERING') {
      if (data.answers.length < 2) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'الترتيب يحتاج عنصرين على الأقل' });
      if (data.answers.some((a) => a.orderIndex === null || a.orderIndex === undefined)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'حدد ترتيب كل عنصر' });
      }
      return;
    }
    // MULTIPLE_CHOICE / TRUE_FALSE / IMAGE_CHOICE
    const correctCount = data.answers.filter((a) => a.isCorrect).length;
    if (correctCount !== 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'يجب تحديد إجابة صحيحة واحدة بالضبط' });
    }
    if (data.type === 'TRUE_FALSE' && data.answers.length !== 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'سؤال صح/خطأ يحتاج خيارين فقط' });
    }
    if (data.type === 'MULTIPLE_CHOICE' && data.answers.length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'الاختيار من متعدد يحتاج خيارين على الأقل' });
    }
  });

export const questionQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  difficulty: z.enum(DIFFICULTIES).optional(),
  type: z.enum(QUESTION_TYPES).optional(),
  status: z.enum(['ACTIVE', 'DISABLED', 'PENDING_REVIEW', 'REJECTED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(10).max(100).default(20),
});

export const categoryInputSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z0-9_]+$/, 'المفتاح يجب أن يكون أحرفًا إنجليزية صغيرة وأرقامًا و _ فقط'),
  nameAr: z.string().trim().min(2),
  icon: z.string().trim().min(1).default('🎯'),
  colorHex: z.string().trim().default('#7c5cff'),
  description: z.string().trim().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const aiGenerateSchema = z.object({
  categoryId: z.string().min(1),
  difficulty: z.enum(DIFFICULTIES),
  type: z.enum(QUESTION_TYPES),
  count: z.number().int().min(1).max(20),
  language: z.enum(['ar', 'en']).default('ar'),
});
