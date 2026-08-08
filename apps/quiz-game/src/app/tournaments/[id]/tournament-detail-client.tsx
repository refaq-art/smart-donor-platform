'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Play, Calendar, Crown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { usePlayer } from '@/components/providers/player-provider';
import { DIFFICULTY_LABELS } from '@/lib/constants';
import { TOURNAMENT_PHASE_LABELS, type TournamentPhase } from '@/lib/tournament';

interface TournamentDetail {
  id: string;
  nameAr: string;
  descriptionAr: string | null;
  category: { key: string; nameAr: string; icon: string } | null;
  difficulty: string | null;
  questionCount: number;
  startAt: string;
  endAt: string;
  phase: TournamentPhase;
}

interface LeaderboardRow {
  rank: number;
  playerId: string;
  displayName: string;
  avatarEmoji: string;
  avatarColor: string;
  bestScore: number;
  gamesPlayed: number;
}

const MEDALS = ['🥇', '🥈', '🥉'];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' });
}

export function TournamentDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { player } = usePlayer();
  const [tournament, setTournament] = useState<TournamentDetail | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  async function load() {
    const res = await fetch(`/api/tournaments/${id}`);
    const data = await res.json();
    if (res.ok) {
      setTournament(data.tournament);
      setLeaderboard(data.leaderboard);
    } else {
      setError(data.error ?? 'تعذّر تحميل البطولة');
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function play() {
    if (!player) {
      router.push('/login');
      return;
    }
    setPlaying(true);
    setError(null);
    try {
      const res = await fetch(`/api/tournaments/${id}/play`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'تعذّر بدء المباراة');
        return;
      }
      sessionStorage.setItem(`quiz_game_${data.gameId}`, JSON.stringify(data));
      router.push(`/play/game/${data.gameId}`);
    } finally {
      setPlaying(false);
    }
  }

  if (error && !tournament) {
    return <p className="py-20 text-center text-arena-danger">{error}</p>;
  }
  if (!tournament) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const myRank = leaderboard.find((r) => r.playerId === player?.id);

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="mb-4">
        <div className="mb-2 flex items-center gap-2">
          <Trophy className="text-arena-gold" size={22} />
          <h1 className="text-xl font-black">{tournament.nameAr}</h1>
          <Badge tone={tournament.phase === 'ACTIVE' ? 'success' : tournament.phase === 'UPCOMING' ? 'primary' : 'neutral'}>
            {TOURNAMENT_PHASE_LABELS[tournament.phase]}
          </Badge>
        </div>
        {tournament.descriptionAr && <p className="mb-3 text-sm text-white/60">{tournament.descriptionAr}</p>}
        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          <Badge tone="neutral">{tournament.category ? `${tournament.category.icon} ${tournament.category.nameAr}` : 'كل التصنيفات'}</Badge>
          {tournament.difficulty && <Badge tone="neutral">{DIFFICULTY_LABELS[tournament.difficulty]}</Badge>}
          <Badge tone="neutral">{tournament.questionCount} سؤال</Badge>
        </div>
        <div className="mb-4 flex flex-col gap-1 text-xs text-white/40">
          <span className="flex items-center gap-1.5">
            <Calendar size={13} /> البدء: {formatDate(tournament.startAt)}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar size={13} /> الانتهاء: {formatDate(tournament.endAt)}
          </span>
        </div>

        {error && <p className="mb-3 rounded-xl bg-arena-danger/20 px-4 py-2 text-center text-sm text-arena-danger">{error}</p>}

        <Button size="lg" className="w-full" disabled={tournament.phase !== 'ACTIVE' || playing} onClick={play}>
          {playing ? <Spinner /> : <Play size={18} />}
          {tournament.phase === 'ACTIVE' ? 'العب الآن' : tournament.phase === 'UPCOMING' ? 'لم تبدأ بعد' : 'انتهت البطولة'}
        </Button>
        {myRank && <p className="mt-2 text-center text-xs text-white/40">ترتيبك الحالي: #{myRank.rank} بأفضل نتيجة {myRank.bestScore.toLocaleString('ar')}</p>}
      </Card>

      <Card>
        <h2 className="mb-3 font-extrabold">🏆 لوحة متصدري البطولة</h2>
        {leaderboard.length === 0 ? (
          <p className="py-8 text-center text-sm text-white/40">لا يوجد مشاركون بعد — كن أول من يلعب!</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {leaderboard.map((r) => (
              <div
                key={r.playerId}
                data-testid="tournament-leaderboard-row"
                className={`flex items-center gap-3 rounded-xl px-3 py-2 ${r.playerId === player?.id ? 'bg-arena-primary/10' : 'bg-white/5'}`}
              >
                <span className="w-7 text-center font-black text-white/50">{MEDALS[r.rank - 1] ?? `#${r.rank}`}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full text-base" style={{ backgroundColor: r.avatarColor }}>
                  {r.avatarEmoji}
                </span>
                <span className="flex-1 font-bold">{r.displayName}</span>
                {r.rank === 1 && <Crown size={14} className="text-arena-gold" />}
                <span className="font-black text-arena-gold">{r.bestScore.toLocaleString('ar')}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
