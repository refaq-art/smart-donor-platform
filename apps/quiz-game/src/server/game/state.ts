import { prisma } from '@/lib/prisma';
import { toEngineQuestion } from '@/lib/questionMapper';
import { toClientQuestion } from '@/game-engine/questionSelector';
import type { RoundState } from './types';

export interface GameStateResponse {
  gameId: string;
  status: string;
  mode: string;
  format: string;
  totalRounds: number;
  sessions: {
    sessionId: string;
    playerId: string;
    displayName: string;
    avatarEmoji: string;
    avatarColor: string;
    localSlot: number | null;
    score: number;
    streak: number;
    status: string;
    teamId: string | null;
    hasAnsweredCurrentRound: boolean;
  }[];
  currentRound: RoundState | null;
}

export async function getGameState(gameId: string): Promise<GameStateResponse> {
  const game = await prisma.game.findUniqueOrThrow({
    where: { id: gameId },
    include: {
      sessions: { include: { player: true } },
      rounds: {
        orderBy: { roundNumber: 'desc' },
        take: 1,
        include: { question: { include: { answers: true, category: true } }, scores: true },
      },
    },
  });

  const latestRound = game.rounds[0] ?? null;
  let currentRound: RoundState | null = null;

  if (latestRound && game.status === 'IN_PROGRESS' && latestRound.startedAt) {
    const engineQuestion = toEngineQuestion(latestRound.question);
    currentRound = {
      roundNumber: latestRound.roundNumber,
      totalRounds: game.questionCount,
      question: toClientQuestion(engineQuestion),
      deadlineAt: new Date(latestRound.startedAt.getTime() + latestRound.timeLimitSeconds * 1000).toISOString(),
      startedAt: latestRound.startedAt.toISOString(),
    };
  }

  const answeredSessionIds = new Set((latestRound?.scores ?? []).map((s) => s.gameSessionId));

  return {
    gameId: game.id,
    status: game.status,
    mode: game.mode,
    format: game.format,
    totalRounds: game.questionCount,
    sessions: game.sessions.map((s) => ({
      sessionId: s.id,
      playerId: s.playerId,
      displayName: s.player.displayName,
      avatarEmoji: s.player.avatarEmoji,
      avatarColor: s.player.avatarColor,
      localSlot: s.localSlot,
      score: s.score,
      streak: s.streak,
      status: s.status,
      teamId: s.teamId,
      hasAnsweredCurrentRound: answeredSessionIds.has(s.id),
    })),
    currentRound,
  };
}
