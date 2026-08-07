import type { ClientQuestion, Difficulty, EngineQuestion } from './types';

export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function pickNextQuestion(
  pool: EngineQuestion[],
  usedIds: Set<string>,
  preferredDifficulty?: Difficulty | null
): EngineQuestion | null {
  const remaining = pool.filter((q) => !usedIds.has(q.id));
  if (remaining.length === 0) return null;

  if (preferredDifficulty) {
    const atLevel = remaining.filter((q) => q.difficulty === preferredDifficulty);
    if (atLevel.length > 0) {
      return shuffle(atLevel)[0];
    }
  }
  return shuffle(remaining)[0];
}

export function selectQuestionSet(
  pool: EngineQuestion[],
  count: number,
  difficulty?: Difficulty | null
): EngineQuestion[] {
  const used = new Set<string>();
  const selected: EngineQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const next = pickNextQuestion(pool, used, difficulty);
    if (!next) break;
    used.add(next.id);
    selected.push(next);
  }
  return selected;
}

/** يحوّل سؤالًا كاملاً (مع الإجابة الصحيحة) إلى نسخة آمنة للعميل، مع ترتيب عشوائي للخيارات */
export function toClientQuestion(question: EngineQuestion): ClientQuestion {
  const options =
    question.type === 'ORDERING'
      ? shuffle(question.answers).map((a) => ({ id: a.id, textAr: a.textAr, imageUrl: a.imageUrl }))
      : question.type === 'WORD_GUESS' || question.type === 'CHARACTER_GUESS'
        ? []
        : shuffle(question.answers).map((a) => ({ id: a.id, textAr: a.textAr, imageUrl: a.imageUrl }));

  return {
    id: question.id,
    categoryId: question.categoryId,
    categoryNameAr: question.categoryNameAr,
    categoryIcon: question.categoryIcon,
    type: question.type,
    difficulty: question.difficulty,
    textAr: question.textAr,
    imageUrl: question.imageUrl,
    timeLimitSeconds: question.timeLimitSeconds,
    basePoints: question.basePoints,
    options,
  };
}
