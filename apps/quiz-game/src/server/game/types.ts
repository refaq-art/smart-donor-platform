import type { ClientQuestion } from '@/game-engine/types';

export interface RoundState {
  roundNumber: number;
  totalRounds: number;
  question: ClientQuestion;
  deadlineAt: string; // ISO timestamp — يستخدمه العميل فقط للعرض، الخادم لا يثق به
  startedAt: string;
}

export interface AnswerResult {
  isCorrect: boolean;
  breakdown: {
    isCorrect: boolean;
    basePoints: number;
    speedMultiplier: number;
    pointsFromSpeed: number;
    streakBonus: number;
    firstCorrectBonus: number;
    penalty: number;
    total: number;
  };
  correctAnswerIds: string[];
  correctOrderIds: string[] | null;
  correctText: string | null;
  explanationAr: string | null;
  newScore: number;
  newStreak: number;
  roundComplete: boolean;
  eliminated: boolean;
  gameFinished: boolean;
  nextRound: RoundState | null;
  finalResults: PlayerResultRow[] | null;
}

export interface PlayerResultRow {
  playerId: string;
  displayName: string;
  avatarEmoji: string;
  avatarColor: string;
  teamId: string | null;
  teamName: string | null;
  score: number;
  rank: number;
  correctAnswers: number;
  totalAnswers: number;
  bestStreak: number;
  isWinner: boolean;
  newAchievements: string[];
}
