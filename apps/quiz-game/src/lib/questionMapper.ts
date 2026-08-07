import type { Answer, Category, Question } from '@prisma/client';
import type { EngineQuestion } from '@/game-engine/types';

type QuestionWithRelations = Question & { answers: Answer[]; category: Category };

export function toEngineQuestion(question: QuestionWithRelations): EngineQuestion {
  return {
    id: question.id,
    categoryId: question.categoryId,
    categoryNameAr: question.category.nameAr,
    categoryIcon: question.category.icon,
    type: question.type,
    difficulty: question.difficulty,
    textAr: question.textAr,
    imageUrl: question.imageUrl,
    explanationAr: question.explanationAr,
    timeLimitSeconds: question.timeLimitSeconds,
    basePoints: question.basePoints,
    answers: question.answers.map((a) => ({
      id: a.id,
      textAr: a.textAr,
      imageUrl: a.imageUrl,
      isCorrect: a.isCorrect,
      orderIndex: a.orderIndex,
    })),
  };
}
