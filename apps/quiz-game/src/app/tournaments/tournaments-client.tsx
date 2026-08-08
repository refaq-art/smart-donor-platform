'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy, Users, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { DIFFICULTY_LABELS } from '@/lib/constants';
import { TOURNAMENT_PHASE_LABELS, type TournamentPhase } from '@/lib/tournament';

interface TournamentRow {
  id: string;
  nameAr: string;
  descriptionAr: string | null;
  category: { key: string; nameAr: string; icon: string } | null;
  difficulty: string | null;
  questionCount: number;
  startAt: string;
  endAt: string;
  participantCount: number;
  phase: TournamentPhase;
}

const PHASE_TONE: Record<TournamentPhase, 'success' | 'primary' | 'neutral' | 'danger'> = {
  ACTIVE: 'success',
  UPCOMING: 'primary',
  COMPLETED: 'neutral',
  CANCELLED: 'danger',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' });
}

export function TournamentsClient() {
  const [tournaments, setTournaments] = useState<TournamentRow[] | null>(null);

  useEffect(() => {
    fetch('/api/tournaments')
      .then((r) => r.json())
      .then((data) => setTournaments(data.tournaments));
  }, []);

  if (!tournaments) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const order: TournamentPhase[] = ['ACTIVE', 'UPCOMING', 'COMPLETED'];
  const sorted = [...tournaments].sort((a, b) => order.indexOf(a.phase) - order.indexOf(b.phase));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-2 flex items-center gap-2 text-2xl font-black">
        <Trophy className="text-arena-gold" /> البطولات
      </h1>
      <p className="mb-6 text-sm text-white/50">منافسات مجدولة بلوحة متصدرين خاصة — العب أكثر من مرة واحتفظ بأفضل نتيجة لك</p>

      {sorted.length === 0 ? (
        <p className="py-16 text-center text-white/40">لا توجد بطولات حاليًا — تابعنا قريبًا!</p>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((t) => (
            <Link key={t.id} href={`/tournaments/${t.id}`}>
              <Card className="transition hover:bg-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <h2 className="font-extrabold">{t.nameAr}</h2>
                      <Badge tone={PHASE_TONE[t.phase]}>{TOURNAMENT_PHASE_LABELS[t.phase]}</Badge>
                    </div>
                    {t.descriptionAr && <p className="mb-2 text-sm text-white/50">{t.descriptionAr}</p>}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-white/40">
                      <Badge tone="neutral">{t.category ? `${t.category.icon} ${t.category.nameAr}` : 'كل التصنيفات'}</Badge>
                      {t.difficulty && <Badge tone="neutral">{DIFFICULTY_LABELS[t.difficulty]}</Badge>}
                      <span className="flex items-center gap-1">
                        <Users size={12} /> {t.participantCount.toLocaleString('ar')} مشارك
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-white/40">
                  <Calendar size={13} />
                  {t.phase === 'UPCOMING' ? `تبدأ: ${formatDate(t.startAt)}` : `تنتهي: ${formatDate(t.endAt)}`}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
