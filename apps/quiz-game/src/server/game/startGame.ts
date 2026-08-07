import { prisma } from '@/lib/prisma';
import { getModeConfig } from '@/game-engine/modes';
import { toClientQuestion } from '@/game-engine/questionSelector';
import type { Difficulty, GameFormat, GameMode } from '@/game-engine/types';
import { loadQuestionPool, pickQuestionForRound } from './questionPool';
import type { RoundState } from './types';

export interface StartGamePlayerInput {
  playerId: string;
  teamKey?: 'A' | 'B' | null;
  localSlot?: number | null;
}

export interface StartGameParams {
  mode: GameMode;
  format: GameFormat;
  categoryIds: string[];
  difficulty?: Difficulty | null;
  questionCount?: number;
  roomId?: string | null;
  players: StartGamePlayerInput[];
}

export interface StartGameResult {
  gameId: string;
  sessionsByPlayerId: Record<string, string>;
  firstRound: RoundState;
  totalRounds: number;
}

function effectiveTimeLimit(baseSeconds: number, multiplier: number): number {
  return Math.max(5, Math.round(baseSeconds * multiplier));
}

export async function startGame(params: StartGameParams): Promise<StartGameResult> {
  const { mode, format, categoryIds, questionCount, roomId, players } = params;
  const config = getModeConfig(mode);
  const isAdaptive = config.adaptiveDifficulty && format === 'SOLO';
  const finalCount = questionCount ?? config.questionCount;
  const initialDifficulty: Difficulty = params.difficulty ?? 'MEDIUM';

  const pool = await loadQuestionPool(categoryIds, isAdaptive ? null : (params.difficulty ?? null));
  if (pool.length === 0) {
    throw new Error('لا توجد أسئلة كافية في التصنيفات المختارة. جرّب تصنيفات أخرى.');
  }

  const firstQuestion = pickQuestionForRound(pool, new Set(), isAdaptive ? initialDifficulty : params.difficulty ?? null);
  if (!firstQuestion) {
    throw new Error('تعذّر اختيار سؤال للبدء.');
  }

  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const game = await tx.game.create({
      data: {
        mode,
        format,
        status: 'IN_PROGRESS',
        categoryIds,
        difficulty: params.difficulty ?? null,
        adaptiveDifficulty: isAdaptive,
        questionCount: finalCount,
        timePerQuestionSeconds: effectiveTimeLimit(20, config.timerMultiplier),
        teamsEnabled: config.teamsEnabled,
        negativeScoring: config.negativeScoring,
        roomId: roomId ?? null,
        startedAt: now,
      },
    });

    const teamIdByKey: Record<string, string> = {};
    if (config.teamsEnabled) {
      const hasTeamA = players.some((p) => p.teamKey === 'A');
      const hasTeamB = players.some((p) => p.teamKey === 'B');
      if (hasTeamA) {
        const teamA = await tx.team.create({ data: { gameId: game.id, name: 'الفريق الأحمر', colorHex: '#f43f5e' } });
        teamIdByKey.A = teamA.id;
      }
      if (hasTeamB) {
        const teamB = await tx.team.create({ data: { gameId: game.id, name: 'الفريق الأزرق', colorHex: '#3b82f6' } });
        teamIdByKey.B = teamB.id;
      }
    }

    const sessionsByPlayerId: Record<string, string> = {};
    for (const p of players) {
      const session = await tx.gameSession.create({
        data: {
          gameId: game.id,
          playerId: p.playerId,
          teamId: p.teamKey ? teamIdByKey[p.teamKey] ?? null : null,
          localSlot: p.localSlot ?? null,
          status: 'IN_PROGRESS',
        },
      });
      sessionsByPlayerId[p.playerId] = session.id;
    }

    const timeLimitSeconds = effectiveTimeLimit(firstQuestion.timeLimitSeconds, config.timerMultiplier);
    const round = await tx.round.create({
      data: {
        gameId: game.id,
        questionId: firstQuestion.id,
        roundNumber: 1,
        timeLimitSeconds,
        startedAt: now,
      },
    });

    return { game, sessionsByPlayerId, round };
  });

  const deadlineAt = new Date(now.getTime() + result.round.timeLimitSeconds * 1000);

  return {
    gameId: result.game.id,
    sessionsByPlayerId: result.sessionsByPlayerId,
    totalRounds: finalCount,
    firstRound: {
      roundNumber: 1,
      totalRounds: finalCount,
      question: toClientQuestion(firstQuestion),
      deadlineAt: deadlineAt.toISOString(),
      startedAt: now.toISOString(),
    },
  };
}
