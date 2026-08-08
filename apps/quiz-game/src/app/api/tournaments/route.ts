export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/server/apiHelpers';
import { computeTournamentPhase } from '@/lib/tournament';

export async function GET() {
  try {
    const tournaments = await prisma.tournament.findMany({
      orderBy: { startAt: 'desc' },
      include: { category: true, _count: { select: { participants: true } } },
    });

    const withPhase = tournaments
      .map((t) => ({
        id: t.id,
        nameAr: t.nameAr,
        descriptionAr: t.descriptionAr,
        category: t.category ? { key: t.category.key, nameAr: t.category.nameAr, icon: t.category.icon } : null,
        difficulty: t.difficulty,
        questionCount: t.questionCount,
        startAt: t.startAt,
        endAt: t.endAt,
        participantCount: t._count.participants,
        phase: computeTournamentPhase(t),
      }))
      .filter((t) => t.phase !== 'CANCELLED');

    return NextResponse.json({ tournaments: withPhase });
  } catch (error) {
    return handleApiError(error);
  }
}
