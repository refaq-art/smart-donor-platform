export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { tournamentInputSchema } from '@/lib/validation/tournament';
import { handleApiError, requireAdmin } from '@/server/apiHelpers';

export async function GET() {
  try {
    await requireAdmin();
    const tournaments = await prisma.tournament.findMany({
      orderBy: { startAt: 'desc' },
      include: { category: true, _count: { select: { participants: true } } },
    });
    return NextResponse.json({ tournaments });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = tournamentInputSchema.parse(await request.json());

    const tournament = await prisma.tournament.create({
      data: {
        nameAr: body.nameAr,
        descriptionAr: body.descriptionAr ?? null,
        categoryId: body.categoryId ?? null,
        difficulty: body.difficulty ?? null,
        questionCount: body.questionCount,
        startAt: new Date(body.startAt),
        endAt: new Date(body.endAt),
      },
    });
    return NextResponse.json({ tournament });
  } catch (error) {
    return handleApiError(error);
  }
}
