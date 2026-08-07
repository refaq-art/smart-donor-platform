import { prisma } from '@/lib/prisma';
import { questionInputSchema } from '@/lib/validation/question';
import type { QuestionDraft } from './rows';

export interface ImportRowError {
  row: number;
  message: string;
}

export interface ImportValidationResult {
  valid: { categoryId: string; data: ReturnType<typeof questionInputSchema.parse> }[];
  errors: ImportRowError[];
}

export async function validateDrafts(drafts: QuestionDraft[]): Promise<ImportValidationResult> {
  const categories = await prisma.category.findMany();
  const categoryByKey = new Map(categories.map((c) => [c.key, c]));

  const valid: ImportValidationResult['valid'] = [];
  const errors: ImportRowError[] = [];

  drafts.forEach((draft, index) => {
    const rowNumber = index + 2; // +1 للعنوان، +1 لبدء الترقيم من 1
    const category = categoryByKey.get(draft.categoryKey);
    if (!category) {
      errors.push({ row: rowNumber, message: `تصنيف غير معروف: "${draft.categoryKey}"` });
      return;
    }

    const parsed = questionInputSchema.safeParse({
      categoryId: category.id,
      type: draft.type,
      difficulty: draft.difficulty,
      textAr: draft.textAr,
      imageUrl: draft.imageUrl || undefined,
      explanationAr: draft.explanationAr || undefined,
      timeLimitSeconds: draft.timeLimitSeconds,
      basePoints: draft.basePoints,
      status: draft.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE',
      answers: draft.answers,
    });

    if (!parsed.success) {
      errors.push({ row: rowNumber, message: parsed.error.issues[0]?.message ?? 'بيانات غير صالحة' });
      return;
    }

    valid.push({ categoryId: category.id, data: parsed.data });
  });

  return { valid, errors };
}
