export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAIProvider } from '@/lib/ai';
import { aiGenerateSchema } from '@/lib/validation/question';
import { handleApiError, jsonError, requireAdmin } from '@/server/apiHelpers';

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const body = aiGenerateSchema.parse(await request.json());

    const category = await prisma.category.findUnique({ where: { id: body.categoryId } });
    if (!category) return jsonError('التصنيف غير موجود', 404);

    const job = await prisma.aIGenerationJob.create({
      data: {
        requestedById: session.playerId,
        categoryId: body.categoryId,
        difficulty: body.difficulty,
        type: body.type,
        language: body.language,
        requestedCount: body.count,
        status: 'PENDING',
      },
    });

    try {
      const provider = getAIProvider();
      const outcome = await provider.generate({
        categoryKey: category.key,
        categoryNameAr: category.nameAr,
        difficulty: body.difficulty,
        type: body.type,
        count: body.count,
        language: body.language,
      });

      const createdQuestions = [];
      for (const draft of outcome.drafts) {
        const question = await prisma.question.create({
          data: {
            categoryId: category.id,
            type: draft.type,
            difficulty: draft.difficulty,
            textAr: draft.textAr,
            explanationAr: draft.explanationAr || null,
            timeLimitSeconds: draft.timeLimitSeconds,
            basePoints: draft.basePoints,
            status: 'PENDING_REVIEW',
            source: 'AI_GENERATED',
            aiJobId: job.id,
            createdById: session.playerId,
            answers: { create: draft.answers },
          },
          include: { answers: true, category: true },
        });
        createdQuestions.push(question);
      }

      await prisma.aIGenerationJob.update({
        where: { id: job.id },
        data: { status: 'COMPLETED', generatedCount: createdQuestions.length, completedAt: new Date() },
      });

      return NextResponse.json({ job, questions: createdQuestions, note: outcome.note });
    } catch (error) {
      await prisma.aIGenerationJob.update({
        where: { id: job.id },
        data: { status: 'FAILED', errorMessage: error instanceof Error ? error.message : 'خطأ غير معروف' },
      });
      throw error;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
