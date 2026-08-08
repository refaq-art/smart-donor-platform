export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startGame } from '@/server/game/startGame';
import { handleApiError, jsonError, requireSession } from '@/server/apiHelpers';
import { computeTournamentPhase } from '@/lib/tournament';

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const tournament = await prisma.tournament.findUnique({ where: { id: params.id } });
    if (!tournament) return jsonError('لا توجد بطولة بهذا المعرّف', 404);

    const phase = computeTournamentPhase(tournament);
    if (phase !== 'ACTIVE') {
      const message = phase === 'UPCOMING' ? 'لم تبدأ هذه البطولة بعد' : phase === 'CANCELLED' ? 'أُلغيت هذه البطولة' : 'انتهت هذه البطولة';
      return jsonError(message, 400);
    }

    await prisma.tournamentParticipant.upsert({
      where: { tournamentId_playerId: { tournamentId: tournament.id, playerId: session.playerId } },
      update: {},
      create: { tournamentId: tournament.id, playerId: session.playerId },
    });

    const categoryIds = tournament.categoryId
      ? [tournament.categoryId]
      : (await prisma.category.findMany({ where: { isActive: true }, select: { id: true } })).map((c) => c.id);

    const result = await startGame({
      mode: 'CLASSIC',
      format: 'SOLO',
      categoryIds,
      difficulty: tournament.difficulty,
      questionCount: tournament.questionCount,
      tournamentId: tournament.id,
      players: [{ playerId: session.playerId, localSlot: 0 }],
    });

    const sessions = await prisma.gameSession.findMany({
      where: { gameId: result.gameId },
      include: { player: true },
      orderBy: { localSlot: 'asc' },
    });

    return NextResponse.json({
      ...result,
      sessions: sessions.map((s) => ({
        sessionId: s.id,
        playerId: s.playerId,
        displayName: s.player.displayName,
        avatarEmoji: s.player.avatarEmoji,
        avatarColor: s.player.avatarColor,
        localSlot: s.localSlot,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
