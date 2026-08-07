export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseWorkbookBuffer } from '@/lib/import-export/excel';
import { rowToDraft, type QuestionDraft } from '@/lib/import-export/rows';
import { validateDrafts } from '@/lib/import-export/validate';
import { handleApiError, jsonError, requireAdmin } from '@/server/apiHelpers';

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const formData = await request.formData();
    const file = formData.get('file');
    const format = String(formData.get('format') ?? '').toLowerCase();

    if (!(file instanceof File)) return jsonError('لم يتم اختيار ملف', 400);
    if (!['csv', 'xlsx', 'json'].includes(format)) return jsonError('صيغة غير مدعومة', 400);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let drafts: QuestionDraft[];
    if (format === 'json') {
      const text = buffer.toString('utf-8');
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        return jsonError('ملف JSON غير صالح', 400);
      }
      if (!Array.isArray(parsed)) return jsonError('يجب أن يحتوي ملف JSON على قائمة أسئلة', 400);
      drafts = parsed as QuestionDraft[];
    } else {
      const rows = await parseWorkbookBuffer(buffer, format as 'csv' | 'xlsx');
      drafts = rows.map(rowToDraft);
    }

    if (drafts.length === 0) return jsonError('الملف لا يحتوي على أسئلة', 400);
    if (drafts.length > 500) return jsonError('الحد الأقصى 500 سؤال في الملف الواحد', 400);

    const { valid, errors } = await validateDrafts(drafts);

    let insertedCount = 0;
    for (const item of valid) {
      await prisma.question.create({
        data: {
          categoryId: item.categoryId,
          type: item.data.type,
          difficulty: item.data.difficulty,
          textAr: item.data.textAr,
          imageUrl: item.data.imageUrl || null,
          explanationAr: item.data.explanationAr || null,
          timeLimitSeconds: item.data.timeLimitSeconds,
          basePoints: item.data.basePoints,
          status: item.data.status,
          source: 'IMPORTED',
          createdById: session.playerId,
          answers: {
            create: item.data.answers.map((a) => ({
              textAr: a.textAr,
              imageUrl: a.imageUrl || null,
              isCorrect: a.isCorrect,
              orderIndex: a.orderIndex ?? null,
            })),
          },
        },
      });
      insertedCount++;
    }

    return NextResponse.json({ insertedCount, totalRows: drafts.length, errors });
  } catch (error) {
    return handleApiError(error);
  }
}
