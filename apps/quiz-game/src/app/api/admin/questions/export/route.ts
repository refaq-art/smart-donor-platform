export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { questionToRow } from '@/lib/import-export/rows';
import { buildWorkbookBuffer } from '@/lib/import-export/excel';
import { handleApiError, jsonError, requireAdmin } from '@/server/apiHelpers';
import type { Prisma } from '@prisma/client';

const CONTENT_TYPES: Record<string, string> = {
  csv: 'text/csv; charset=utf-8',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  json: 'application/json; charset=utf-8',
};

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') ?? 'json').toLowerCase();
    if (!['csv', 'xlsx', 'json'].includes(format)) return jsonError('صيغة غير مدعومة', 400);

    const categoryId = searchParams.get('categoryId');
    const difficulty = searchParams.get('difficulty');
    const status = searchParams.get('status');

    const where = {
      ...(categoryId ? { categoryId } : {}),
      ...(difficulty ? { difficulty } : {}),
      ...(status ? { status } : {}),
    } as Prisma.QuestionWhereInput;

    const questions = await prisma.question.findMany({
      where,
      include: { category: true, answers: { orderBy: { orderIndex: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });

    let body: Buffer | string;

    if (format === 'json') {
      body = JSON.stringify(
        questions.map((q) => ({
          categoryKey: q.category.key,
          type: q.type,
          difficulty: q.difficulty,
          textAr: q.textAr,
          imageUrl: q.imageUrl,
          explanationAr: q.explanationAr,
          timeLimitSeconds: q.timeLimitSeconds,
          basePoints: q.basePoints,
          status: q.status,
          answers: q.answers.map((a) => ({ textAr: a.textAr, isCorrect: a.isCorrect, orderIndex: a.orderIndex })),
        })),
        null,
        2
      );
    } else {
      const rows = questions.map((q) => questionToRow(q));
      body = await buildWorkbookBuffer(rows, format as 'csv' | 'xlsx');
    }

    return new Response(body, {
      headers: {
        'Content-Type': CONTENT_TYPES[format],
        'Content-Disposition': `attachment; filename="questions-export.${format}"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
