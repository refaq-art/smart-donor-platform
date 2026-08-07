import { prisma } from '@/lib/prisma';
import { toEngineQuestion } from '@/lib/questionMapper';
import { pickNextQuestion } from '@/game-engine/questionSelector';
import type { Difficulty, EngineQuestion } from '@/game-engine/types';

export async function loadQuestionPool(categoryIds: string[], difficulty?: Difficulty | null): Promise<EngineQuestion[]> {
  const questions = await prisma.question.findMany({
    where: {
      categoryId: { in: categoryIds },
      status: 'ACTIVE',
      ...(difficulty ? { difficulty } : {}),
    },
    include: { answers: true, category: true },
  });
  return questions.map(toEngineQuestion);
}

export async function getUsedQuestionIds(gameId: string): Promise<Set<string>> {
  const rounds = await prisma.round.findMany({ where: { gameId }, select: { questionId: true } });
  return new Set(rounds.map((r) => r.questionId));
}

export function pickQuestionForRound(
  pool: EngineQuestion[],
  usedIds: Set<string>,
  preferredDifficulty?: Difficulty | null
): EngineQuestion | null {
  return pickNextQuestion(pool, usedIds, preferredDifficulty);
}
