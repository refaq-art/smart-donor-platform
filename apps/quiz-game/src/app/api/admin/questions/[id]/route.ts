export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { questionInputSchema } from '@/lib/validation/question';
import { handleApiError, jsonError, requireAdmin } from '@/server/apiHelpers';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const question = await prisma.question.findUnique({ where: { id: params.id }, include: { answers: true, category: true } });
    if (!question) return jsonError('السؤال غير موجود', 404);
    return NextResponse.json({ question });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const body = questionInputSchema.parse(await request.json());

    await prisma.$transaction(async (tx) => {
      await tx.answer.deleteMany({ where: { questionId: params.id } });
      await tx.question.update({
        where: { id: params.id },
        data: {
          categoryId: body.categoryId,
          type: body.type,
          difficulty: body.difficulty,
          textAr: body.textAr,
          imageUrl: body.imageUrl || null,
          explanationAr: body.explanationAr || null,
          timeLimitSeconds: body.timeLimitSeconds,
          basePoints: body.basePoints,
          status: body.status,
          answers: {
            create: body.answers.map((a) => ({
              textAr: a.textAr,
              imageUrl: a.imageUrl || null,
              isCorrect: a.isCorrect,
              orderIndex: a.orderIndex ?? null,
            })),
          },
        },
      });
    });

    const question = await prisma.question.findUnique({ where: { id: params.id }, include: { answers: true, category: true } });
    return NextResponse.json({ question });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    await prisma.question.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
