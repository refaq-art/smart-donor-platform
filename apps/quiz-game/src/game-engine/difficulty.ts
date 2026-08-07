import type { Difficulty } from './types';

const LADDER: Difficulty[] = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'];

export const ADAPTIVE_WINDOW = 4; // عدد آخر الإجابات المستخدَم لتقييم الأداء
export const STEP_UP_THRESHOLD = 0.75; // نسبة صحة تؤدي لرفع الصعوبة
export const STEP_DOWN_THRESHOLD = 0.4; // نسبة صحة تؤدي لخفض الصعوبة

/**
 * صعوبة تكيّفية: تراقب آخر إجابات اللاعب (صحيحة/خاطئة) وتُعدّل صعوبة السؤال التالي تلقائيًا.
 */
export function nextAdaptiveDifficulty(recentCorrectness: boolean[], current: Difficulty): Difficulty {
  const window = recentCorrectness.slice(-ADAPTIVE_WINDOW);
  if (window.length < 3) return current;

  const correctRate = window.filter(Boolean).length / window.length;
  const currentIndex = LADDER.indexOf(current);

  if (correctRate >= STEP_UP_THRESHOLD && currentIndex < LADDER.length - 1) {
    return LADDER[currentIndex + 1];
  }
  if (correctRate <= STEP_DOWN_THRESHOLD && currentIndex > 0) {
    return LADDER[currentIndex - 1];
  }
  return current;
}

export function difficultyIndex(d: Difficulty): number {
  return LADDER.indexOf(d);
}

export const DIFFICULTY_LADDER = LADDER;
