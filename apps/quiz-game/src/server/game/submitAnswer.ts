import { prisma } from '@/lib/prisma';
import { toEngineQuestion } from '@/lib/questionMapper';
import { evaluateAnswer, computeScore } from '@/game-engine/scoring';
import { getModeConfig } from '@/game-engine/modes';
import { nextAdaptiveDifficulty } from '@/game-engine/difficulty';
import { toClientQuestion } from '@/game-engine/questionSelector';
import type { GameMode } from '@/game-engine/types';
import { loadQuestionPool, getUsedQuestionIds, pickQuestionForRound } from './questionPool';
import { finishGame } from './finishGame';
import type { AnswerResult, RoundState } from './types';

export interface SubmitAnswerParams {
  gameId: string;
  sessionId: string;
  roundNumber: number;
  selectedAnswerIds?: string[];
  orderedAnswerIds?: string[];
  textAnswer?: string;
}

function effectiveTimeLimit(baseSeconds: number, multiplier: number): number {
  return Math.max(5, Math.round(baseSeconds * multiplier));
}

export async function submitAnswer(params: SubmitAnswerParams): Promise<AnswerResult> {
  const { gameId, sessionId, roundNumber } = params;

  const session = await prisma.gameSession.findUniqueOrThrow({
    where: { id: sessionId },
    include: { game: true },
  });
  if (session.gameId !== gameId) throw new Error('جلسة غير صالحة لهذه اللعبة');
  if (session.game.status !== 'IN_PROGRESS') throw new Error('انتهت اللعبة بالفعل');

  const round = await prisma.round.findUniqueOrThrow({
    where: { gameId_roundNumber: { gameId, roundNumber } },
    include: { question: { include: { answers: true, category: true } } },
  });
  if (!round.startedAt) throw new Error('لم تبدأ الجولة بعد');

  // منع الإجابة المزدوجة: إن وُجدت نتيجة سابقة لهذه الجولة أعِد نفس النتيجة
  const existingScore = await prisma.score.findFirst({ where: { gameSessionId: sessionId, roundId: round.id } });
  if (existingScore) {
    return buildIdempotentResponse(existingScore, session, round);
  }

  const engineQuestion = toEngineQuestion(round.question);
  const now = Date.now();
  const elapsedMs = now - round.startedAt.getTime();
  const timeLimitMs = round.timeLimitSeconds * 1000;
  const timedOut = elapsedMs > timeLimitMs;
  const clampedElapsed = Math.min(Math.max(elapsedMs, 0), timeLimitMs);

  const isCorrect = timedOut
    ? false
    : evaluateAnswer(engineQuestion, {
        questionId: round.questionId,
        selectedAnswerIds: params.selectedAnswerIds,
        orderedAnswerIds: params.orderedAnswerIds,
        textAnswer: params.textAnswer,
        answerTimeMs: clampedElapsed,
        streakBeforeAnswer: session.streak,
      });

  const priorCorrectCount = await prisma.score.count({ where: { roundId: round.id, isCorrect: true } });
  const isFirstCorrectInRound = isCorrect && session.game.format !== 'SOLO' && priorCorrectCount === 0;

  const breakdown = computeScore({
    question: engineQuestion,
    isCorrect,
    answerTimeMs: clampedElapsed,
    streakBeforeAnswer: session.streak,
    isFirstCorrectInRound,
    negativeScoringEnabled: session.game.negativeScoring,
    timedOut,
  });

  const newStreak = isCorrect ? session.streak + 1 : 0;
  const newScore = Math.max(0, session.score + breakdown.total);
  const newBestStreak = Math.max(session.bestStreak, newStreak);

  await prisma.score.create({
    data: {
      gameSessionId: sessionId,
      roundId: round.id,
      questionId: round.questionId,
      isCorrect,
      pointsEarned: breakdown.total,
      breakdown: breakdown as unknown as object,
      answerTimeMs: clampedElapsed,
      streakAtAnswer: session.streak,
      selectedAnswer: {
        selectedAnswerIds: params.selectedAnswerIds ?? null,
        orderedAnswerIds: params.orderedAnswerIds ?? null,
        textAnswer: params.textAnswer ?? null,
        timedOut,
      },
    },
  });

  const config = getModeConfig(session.game.mode as GameMode);

  await prisma.gameSession.update({
    where: { id: sessionId },
    data: {
      score: newScore,
      streak: newStreak,
      bestStreak: newBestStreak,
      correctCount: { increment: isCorrect ? 1 : 0 },
      wrongCount: { increment: isCorrect ? 0 : 1 },
      currentRoundIndex: roundNumber,
    },
  });

  let eliminated = false;
  if (config.eliminationEnabled) {
    eliminated = await maybeEliminateLowestScorers(gameId, round.id);
  }

  const activeSessions = await prisma.gameSession.findMany({
    where: { gameId, status: 'IN_PROGRESS' },
  });
  const answeredCount = await prisma.score.count({ where: { roundId: round.id, gameSessionId: { in: activeSessions.map((s) => s.id) } } });
  const roundComplete = answeredCount >= activeSessions.length;

  let nextRound: RoundState | null = null;
  let gameFinished = false;
  let finalResults = null;

  if (roundComplete) {
    const isLastByCount = roundNumber >= session.game.questionCount;
    const isLastByElimination = config.eliminationEnabled && activeSessions.length <= 1;

    if (isLastByCount || isLastByElimination || activeSessions.length === 0) {
      finalResults = await finishGame(gameId);
      gameFinished = true;
    } else {
      nextRound = await advanceToNextRound(session.game, roundNumber, engineQuestion.difficulty, config, session.game.questionCount);
    }
  }

  return {
    isCorrect,
    breakdown,
    correctAnswerIds: round.question.answers.filter((a) => a.isCorrect).map((a) => a.id),
    correctOrderIds:
      round.question.type === 'ORDERING'
        ? [...round.question.answers].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)).map((a) => a.id)
        : null,
    correctText:
      round.question.type === 'WORD_GUESS' || round.question.type === 'CHARACTER_GUESS'
        ? round.question.answers.find((a) => a.isCorrect)?.textAr ?? null
        : null,
    explanationAr: round.question.explanationAr,
    newScore,
    newStreak,
    roundComplete,
    eliminated,
    gameFinished,
    nextRound,
    finalResults,
  };
}

async function maybeEliminateLowestScorers(gameId: string, roundId: string): Promise<boolean> {
  const activeSessions = await prisma.gameSession.findMany({ where: { gameId, status: 'IN_PROGRESS' } });
  if (activeSessions.length <= 1) return false;

  const answeredForRound = await prisma.score.findMany({ where: { roundId, gameSessionId: { in: activeSessions.map((s) => s.id) } } });
  if (answeredForRound.length < activeSessions.length) return false; // لم يُجب الجميع بعد، لا تُقصِ أحدًا

  const minScore = Math.min(...activeSessions.map((s) => s.score));
  const toEliminate = activeSessions.filter((s) => s.score === minScore);
  if (toEliminate.length >= activeSessions.length) return false; // لا تُقصِ الجميع

  await prisma.gameSession.updateMany({
    where: { id: { in: toEliminate.map((s) => s.id) } },
    data: { status: 'ELIMINATED', finishedAt: new Date() },
  });
  return true;
}

async function advanceToNextRound(
  game: { id: string; categoryIds: unknown; difficulty: string | null; adaptiveDifficulty: boolean },
  currentRoundNumber: number,
  lastDifficulty: RoundState['question']['difficulty'],
  config: ReturnType<typeof getModeConfig>,
  totalRounds: number
): Promise<RoundState> {
  const categoryIds = game.categoryIds as string[];
  const pool = await loadQuestionPool(categoryIds, game.adaptiveDifficulty ? null : ((game.difficulty as any) ?? null));
  const usedIds = await getUsedQuestionIds(game.id);

  let targetDifficulty = (game.difficulty as any) ?? null;
  if (game.adaptiveDifficulty) {
    const recentScores = await prisma.score.findMany({
      where: { gameSession: { gameId: game.id } },
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: { isCorrect: true },
    });
    targetDifficulty = nextAdaptiveDifficulty(recentScores.map((s) => s.isCorrect).reverse(), lastDifficulty as any);
  }

  const nextQuestion = pickQuestionForRound(pool, usedIds, targetDifficulty);
  if (!nextQuestion) {
    throw new Error('نفدت الأسئلة المتاحة في هذا التصنيف');
  }

  const now = new Date();
  const timeLimitSeconds = Math.max(5, Math.round(nextQuestion.timeLimitSeconds * config.timerMultiplier));
  const round = await prisma.round.create({
    data: {
      gameId: game.id,
      questionId: nextQuestion.id,
      roundNumber: currentRoundNumber + 1,
      timeLimitSeconds,
      startedAt: now,
    },
  });

  return {
    roundNumber: round.roundNumber,
    totalRounds,
    question: toClientQuestion(nextQuestion),
    deadlineAt: new Date(now.getTime() + timeLimitSeconds * 1000).toISOString(),
    startedAt: now.toISOString(),
  };
}

function buildIdempotentResponse(
  existingScore: { isCorrect: boolean; pointsEarned: number; breakdown: unknown },
  session: { score: number; streak: number },
  round: { question: { explanationAr: string | null; answers: { id: string; isCorrect: boolean; orderIndex: number | null }[]; type: string } }
): AnswerResult {
  return {
    isCorrect: existingScore.isCorrect,
    breakdown: existingScore.breakdown as AnswerResult['breakdown'],
    correctAnswerIds: round.question.answers.filter((a) => a.isCorrect).map((a) => a.id),
    correctOrderIds:
      round.question.type === 'ORDERING'
        ? [...round.question.answers].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)).map((a) => a.id)
        : null,
    correctText: null,
    explanationAr: round.question.explanationAr,
    newScore: session.score,
    newStreak: session.streak,
    roundComplete: true,
    eliminated: false,
    gameFinished: false,
    nextRound: null,
    finalResults: null,
  };
}
