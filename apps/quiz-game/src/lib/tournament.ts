export type TournamentPhase = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export function computeTournamentPhase(t: { status: string; startAt: string | Date; endAt: string | Date }): TournamentPhase {
  if (t.status === 'CANCELLED') return 'CANCELLED';
  const now = Date.now();
  const start = new Date(t.startAt).getTime();
  const end = new Date(t.endAt).getTime();
  if (now < start) return 'UPCOMING';
  if (now > end) return 'COMPLETED';
  return 'ACTIVE';
}

export const TOURNAMENT_PHASE_LABELS: Record<TournamentPhase, string> = {
  UPCOMING: 'قادمة',
  ACTIVE: 'جارية الآن',
  COMPLETED: 'انتهت',
  CANCELLED: 'أُلغيت',
};
