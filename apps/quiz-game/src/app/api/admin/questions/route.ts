export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { questionInputSchema, questionQuerySchema } from '@/lib/validation/question';
import { handleApiError, requireAdmin } from '@/server/apiHelpers';
import type { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const query = questionQuerySchema.parse(Object.fromEntries(searchParams));

    const where: Prisma.QuestionWhereInput = {
      ...(query.search ? { textAr: { contains: query.search, mode: 'insensitive' } } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.difficulty ? { difficulty: query.difficulty } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.question.findMany({
        where,
        include: { category: true, answers: true },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.question.count({ where }),
    ]);

    return NextResponse.json({ items, total, page: query.page, pageSize: query.pageSize });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const body = questionInputSchema.parse(await request.json());

    const question = await prisma.question.create({
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
        source: 'MANUAL',
        createdById: session.playerId,
        answers: {
          create: body.answers.map((a) => ({
            textAr: a.textAr,
            imageUrl: a.imageUrl || null,
            isCorrect: a.isCorrect,
            orderIndex: a.orderIndex ?? null,
          })),
        },
      },
      include: { answers: true, category: true },
    });

    return NextResponse.json({ question });
  } catch (error) {
    return handleApiError(error);
  }
}
