export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'WORD_GUESS'
  | 'CHARACTER_GUESS'
  | 'ORDERING'
  | 'IMAGE_CHOICE';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';

export type GameMode =
  | 'QUICK_PLAY'
  | 'CLASSIC'
  | 'TIME_ATTACK'
  | 'ELIMINATION'
  | 'TEAM_BATTLE'
  | 'CHALLENGE'
  | 'PARTY'
  | 'ONLINE_ROOM'
  | 'LOCAL_MULTIPLAYER';

export type GameFormat = 'SOLO' | 'LOCAL' | 'ONLINE';

export interface EngineAnswer {
  id: string;
  textAr: string;
  imageUrl?: string | null;
  isCorrect: boolean;
  orderIndex?: number | null;
}

export interface EngineQuestion {
  id: string;
  categoryId: string;
  categoryNameAr: string;
  categoryIcon: string;
  type: QuestionType;
  difficulty: Difficulty;
  textAr: string;
  imageUrl?: string | null;
  explanationAr?: string | null;
  timeLimitSeconds: number;
  basePoints: number;
  answers: EngineAnswer[];
}

/** نسخة آمنة تُرسل للعميل قبل الإجابة — لا تكشف الإجابة الصحيحة أو ترتيبها */
export interface ClientQuestion {
  id: string;
  categoryId: string;
  categoryNameAr: string;
  categoryIcon: string;
  type: QuestionType;
  difficulty: Difficulty;
  textAr: string;
  imageUrl?: string | null;
  timeLimitSeconds: number;
  basePoints: number;
  options: { id: string; textAr: string; imageUrl?: string | null }[];
}

export interface AnswerSubmission {
  questionId: string;
  selectedAnswerIds?: string[];
  orderedAnswerIds?: string[];
  textAnswer?: string;
  answerTimeMs: number;
  streakBeforeAnswer: number;
  isFirstCorrectInRound?: boolean;
}

export interface ScoreBreakdown {
  isCorrect: boolean;
  basePoints: number;
  speedMultiplier: number;
  pointsFromSpeed: number;
  streakBonus: number;
  firstCorrectBonus: number;
  penalty: number;
  total: number;
}

export interface GameModeConfig {
  mode: GameMode;
  questionCount: number;
  negativeScoring: boolean;
  adaptiveDifficulty: boolean;
  teamsEnabled: boolean;
  eliminationEnabled: boolean;
  timerMultiplier: number; // يضرب في timeLimitSeconds الأصلي للسؤال
}
