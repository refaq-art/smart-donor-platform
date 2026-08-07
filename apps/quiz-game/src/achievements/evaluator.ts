import { ACHIEVEMENT_DEFINITIONS } from '@/lib/constants';
import { accuracyPercent } from '@/lib/utils';

export interface AchievementContext {
  gamesWon: number;
  gamesPlayed: number;
  bestStreak: number;
  correctAnswers: number;
  totalAnswers: number;
  isFlawlessGame: boolean;
  fastestAnswerMsInGame: number | null;
  categoryCorrectCounts: Record<string, number>;
}

type Criteria = (typeof ACHIEVEMENT_DEFINITIONS)[number]['criteria'];

function checkCriteria(criteria: Criteria, ctx: AchievementContext): boolean {
  switch (criteria.type) {
    case 'games_won':
      return ctx.gamesWon >= criteria.value;
    case 'games_played':
      return ctx.gamesPlayed >= criteria.value;
    case 'best_streak':
      return ctx.bestStreak >= criteria.value;
    case 'flawless_game':
      return ctx.isFlawlessGame;
    case 'answer_time_ms':
      return ctx.fastestAnswerMsInGame !== null && ctx.fastestAnswerMsInGame <= criteria.value;
    case 'category_correct':
      return (ctx.categoryCorrectCounts[criteria.category] ?? 0) >= criteria.value;
    case 'accuracy':
      return (
        ctx.gamesPlayed >= (criteria.minGames ?? 0) &&
        accuracyPercent(ctx.correctAnswers, ctx.totalAnswers) >= criteria.value
      );
    default:
      return false;
  }
}

/** يعيد مفاتيح الإنجازات الجديدة التي حققها اللاعب بعد آخر مباراة */
export function evaluateNewAchievements(
  ctx: AchievementContext,
  alreadyUnlockedKeys: Set<string>
): string[] {
  const unlocked: string[] = [];
  for (const def of ACHIEVEMENT_DEFINITIONS) {
    if (alreadyUnlockedKeys.has(def.key)) continue;
    if (checkCriteria(def.criteria, ctx)) unlocked.push(def.key);
  }
  return unlocked;
}
