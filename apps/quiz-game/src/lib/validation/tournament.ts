import { z } from 'zod';

export const tournamentInputSchema = z
  .object({
    nameAr: z.string().min(2, 'اسم البطولة قصير جدًا').max(80),
    descriptionAr: z.string().max(300).optional().nullable(),
    categoryId: z.string().optional().nullable(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT']).optional().nullable(),
    questionCount: z.number().int().min(3).max(50).default(10),
    startAt: z.string().datetime({ offset: true }).or(z.string().min(1)),
    endAt: z.string().datetime({ offset: true }).or(z.string().min(1)),
  })
  .refine((data) => new Date(data.endAt).getTime() > new Date(data.startAt).getTime(), {
    message: 'يجب أن يكون وقت الانتهاء بعد وقت البدء',
    path: ['endAt'],
  });

export const tournamentUpdateSchema = z.object({
  nameAr: z.string().min(2).max(80).optional(),
  descriptionAr: z.string().max(300).optional().nullable(),
  status: z.enum(['SCHEDULED', 'CANCELLED']).optional(),
  startAt: z.string().min(1).optional(),
  endAt: z.string().min(1).optional(),
});
