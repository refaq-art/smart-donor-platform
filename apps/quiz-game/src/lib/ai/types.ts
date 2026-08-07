import type { Difficulty, QuestionType } from '@/game-engine/types';

export interface AIQuestionDraft {
  textAr: string;
  type: QuestionType;
  difficulty: Difficulty;
  explanationAr: string;
  timeLimitSeconds: number;
  basePoints: number;
  answers: { textAr: string; isCorrect: boolean; orderIndex: number | null }[];
}

export interface AIGenerateParams {
  categoryKey: string;
  categoryNameAr: string;
  difficulty: Difficulty;
  type: QuestionType;
  count: number;
  language: 'ar' | 'en';
}

export interface AIGenerateOutcome {
  drafts: AIQuestionDraft[];
  note?: string;
}

export interface AIProvider {
  generate(params: AIGenerateParams): Promise<AIGenerateOutcome>;
}
