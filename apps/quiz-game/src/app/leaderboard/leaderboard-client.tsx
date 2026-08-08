'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

type Range = 'today' | 'week' | 'all';
type SortBy = 'score' | 'wins' | 'streak';

interface Entry {
  rank: number;
  playerId: string;
  displayName: string;
  avatarEmoji: string;
  avatarColor: string;
  value: number;
  gamesPlayed: number;
  gamesWon: number;
  bestStreak: number;
}

const RANGE_TABS: { key: Range; label: string }[] = [
  { key: 'today', label: 'اليوم' },
  { key: 'week', label: 'هذا الأسبوع' },
  { key: 'all', label: 'الإجمالي' },
];

const SORT_TABS: { key: SortBy; label: string }[] = [
  { key: 'score', label: 'النقاط' },
  { key: 'wins', label: 'أكثر فوزًا' },
  { key: 'streak', label: 'أعلى سلسلة' },
];

const MEDALS = ['🥇', '🥈', '🥉'];

export function LeaderboardClient() {
  const [range, setRange] = useState<Range>('all');
  const [sortBy, setSortBy] = useState<SortBy>('score');
  const [entries, setEntries] = useState<Entry[] | null>(null);

  useEffect(() => {
    setEntries(null);
    const effectiveSort = range === 'all' ? sortBy : 'score';
    fetch(`/api/leaderboard?range=${range}&sortBy=${effectiveSort}`)
      .then((r) => r.json())
      .then((data) => setEntries(data.entries));
  }, [range, sortBy]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-black">🏆 لوحة المتصدرين</h1>

      <div className="mb-3 flex gap-2 overflow-x-auto">
        {RANGE_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setRange(t.key)}
            className={cn(
              'whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-bold transition',
              range === t.key ? 'bg-primary-gradient text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {range === 'all' && (
        <div className="mb-5 flex gap-2 overflow-x-auto">
          {SORT_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setSortBy(t.key)}
              className={cn(
                'whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold transition',
                sortBy === t.key ? 'border-arena-accent2 text-arena-accent2' : 'border-white/10 text-white/50 hover:text-white'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {!entries ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : entries.length === 0 ? (
        <p className="py-16 text-center text-white/50">لا توجد بيانات بعد — كن أول من يلعب!</p>
      ) : (
        <Card>
          <div className="flex flex-col gap-1">
            {entries.map((e, i) => (
              <motion.div
                key={e.playerId}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
              >
                <Link
                  href={`/profile/${e.playerId}`}
                  data-testid="leaderboard-row"
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/5',
                    e.rank <= 3 && 'bg-white/5'
                  )}
                >
                  <span className="w-8 text-center font-black text-white/50">{MEDALS[e.rank - 1] ?? `#${e.rank}`}</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full text-lg" style={{ backgroundColor: e.avatarColor }}>
                    {e.avatarEmoji}
                  </span>
                  <span className="flex-1 font-bold">{e.displayName}</span>
                  <span className="text-xs text-white/40">{e.gamesPlayed} مباراة</span>
                  <span className="flex items-center gap-1 font-black text-arena-gold">
                    {sortBy === 'wins' && e.rank === 1 && <Crown size={14} />}
                    {e.value.toLocaleString('ar')}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
