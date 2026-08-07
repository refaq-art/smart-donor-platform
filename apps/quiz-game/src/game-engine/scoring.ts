import { SCORING } from '@/lib/constants';
import { isTextAnswerCorrect } from './textNormalize';
import type { AnswerSubmission, EngineQuestion, ScoreBreakdown } from './types';

/**
 * محرك اللعبة يعمل بالكامل على الخادم: العميل لا يرسل سوى اختياره ووقت إجابته،
 * والخادم هو من يحدد صحة الإجابة ويحسب النقاط. هذا يمنع أي تلاعب من جهة العميل.
 */
export function evaluateAnswer(question: EngineQuestion, submission: AnswerSubmission): boolean {
  switch (question.type) {
    case 'MULTIPLE_CHOICE':
    case 'TRUE_FALSE':
    case 'IMAGE_CHOICE': {
      const selected = submission.selectedAnswerIds ?? [];
      if (selected.length !== 1) return false;
      const correct = question.answers.find((a) => a.isCorrect);
      return !!correct && correct.id === selected[0];
    }
    case 'WORD_GUESS':
    case 'CHARACTER_GUESS': {
      if (!submission.textAnswer) return false;
      const accepted = question.answers.filter((a) => a.isCorrect).map((a) => a.textAr);
      return isTextAnswerCorrect(submission.textAnswer, accepted);
    }
    case 'ORDERING': {
      const submitted = submission.orderedAnswerIds ?? [];
      const correctOrder = [...question.answers]
        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
        .map((a) => a.id);
      if (submitted.length !== correctOrder.length) return false;
      return submitted.every((id, index) => id === correctOrder[index]);
    }
    default:
      return false;
  }
}

export function computeSpeedMultiplier(answerTimeMs: number, timeLimitSeconds: number): number {
  const timeLimitMs = Math.max(timeLimitSeconds * 1000, 1);
  const clampedTime = Math.min(Math.max(answerTimeMs, 0), timeLimitMs);
  const timeFraction = 1 - clampedTime / timeLimitMs; // 1 = إجابة فورية، 0 = آخر لحظة
  const { MIN_SPEED_MULTIPLIER, MAX_SPEED_MULTIPLIER } = SCORING;
  return MIN_SPEED_MULTIPLIER + (MAX_SPEED_MULTIPLIER - MIN_SPEED_MULTIPLIER) * timeFraction;
}

export function computeScore(params: {
  question: EngineQuestion;
  isCorrect: boolean;
  answerTimeMs: number;
  streakBeforeAnswer: number;
  isFirstCorrectInRound: boolean;
  negativeScoringEnabled: boolean;
  timedOut: boolean;
}): ScoreBreakdown {
  const { question, isCorrect, answerTimeMs, streakBeforeAnswer, isFirstCorrectInRound, negativeScoringEnabled, timedOut } = params;

  if (!isCorrect) {
    const penalty = !timedOut && negativeScoringEnabled ? SCORING.WRONG_ANSWER_PENALTY : 0;
    return {
      isCorrect: false,
      basePoints: question.basePoints,
      speedMultiplier: 0,
      pointsFromSpeed: 0,
      streakBonus: 0,
      firstCorrectBonus: 0,
      penalty,
      total: -penalty,
    };
  }

  const speedMultiplier = computeSpeedMultiplier(answerTimeMs, question.timeLimitSeconds);
  const pointsFromSpeed = Math.round(question.basePoints * speedMultiplier);
  const streakBonus = Math.min(streakBeforeAnswer * SCORING.STREAK_BONUS_PER_ANSWER, SCORING.STREAK_BONUS_CAP);
  const firstCorrectBonus = isFirstCorrectInRound ? SCORING.FIRST_CORRECT_BONUS : 0;
  const total = pointsFromSpeed + streakBonus + firstCorrectBonus;

  return {
    isCorrect: true,
    basePoints: question.basePoints,
    speedMultiplier,
    pointsFromSpeed,
    streakBonus,
    firstCorrectBonus,
    penalty: 0,
    total,
  };
}
