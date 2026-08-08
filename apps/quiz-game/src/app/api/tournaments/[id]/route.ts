export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, jsonError } from '@/server/apiHelpers';
import { computeTournamentPhase } from '@/lib/tournament';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        participants: {
          orderBy: { bestScore: 'desc' },
          take: 100,
          include: { player: { select: { id: true, displayName: true, avatarEmoji: true, avatarColor: true } } },
        },
      },
    });
    if (!tournament) return jsonError('لا توجد بطولة بهذا المعرّف', 404);

    const leaderboard = tournament.participants.map((p, i) => ({
      rank: i + 1,
      playerId: p.player.id,
      displayName: p.player.displayName,
      avatarEmoji: p.player.avatarEmoji,
      avatarColor: p.player.avatarColor,
      bestScore: p.bestScore,
      gamesPlayed: p.gamesPlayed,
    }));

    return NextResponse.json({
      tournament: {
        id: tournament.id,
        nameAr: tournament.nameAr,
        descriptionAr: tournament.descriptionAr,
        category: tournament.category ? { key: tournament.category.key, nameAr: tournament.category.nameAr, icon: tournament.category.icon } : null,
        difficulty: tournament.difficulty,
        questionCount: tournament.questionCount,
        startAt: tournament.startAt,
        endAt: tournament.endAt,
        phase: computeTournamentPhase(tournament),
      },
      leaderboard,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
