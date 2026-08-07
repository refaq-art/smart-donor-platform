'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Trash2, Play } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { usePlayer } from '@/components/providers/player-provider';
import { DIFFICULTY_LABELS, GAME_MODE_LABELS, AVATAR_EMOJIS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { GameMode } from '@/game-engine/types';

interface CategoryOption {
  id: string;
  key: string;
  nameAr: string;
  icon: string;
  questionCount: number;
}

const SELECTABLE_MODES: GameMode[] = ['QUICK_PLAY', 'CLASSIC', 'TIME_ATTACK', 'ELIMINATION', 'TEAM_BATTLE', 'CHALLENGE', 'PARTY'];

export function SetupClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { player } = usePlayer();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [mode, setMode] = useState<GameMode>(() => {
    const fromQuery = searchParams.get('mode') as GameMode | null;
    return fromQuery && SELECTABLE_MODES.includes(fromQuery) ? fromQuery : 'CLASSIC';
  });
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(() => {
    const fromQuery = searchParams.get('category');
    return fromQuery ? [fromQuery] : [];
  });
  const [difficulty, setDifficulty] = useState<string>('');
  const [isLocal, setIsLocal] = useState(() => searchParams.get('local') === '1');
  const [localPlayers, setLocalPlayers] = useState<string[]>(['لاعب 2']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => setCategories(data.categories));
  }, []);

  function toggleCategory(id: string) {
    setSelectedCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  async function start() {
    setError(null);
    if (selectedCategoryIds.length === 0) {
      setError('اختر تصنيفًا واحدًا على الأقل');
      return;
    }
    setLoading(true);
    try {
      const teamModeSplit = mode === 'TEAM_BATTLE';
      const res = await fetch('/api/game/solo/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          format: isLocal ? 'LOCAL' : 'SOLO',
          categoryIds: selectedCategoryIds,
          difficulty: difficulty || null,
          localPlayers: isLocal
            ? [
                { displayName: player?.displayName ?? 'أنا', teamKey: teamModeSplit ? 'A' : undefined },
                ...localPlayers
                  .filter((n) => n.trim())
                  .map((name, i) => ({ displayName: name.trim(), teamKey: teamModeSplit ? (i % 2 === 0 ? 'B' : 'A') : undefined })),
              ]
            : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'حدث خطأ');
        return;
      }
      sessionStorage.setItem(`quiz_game_${data.gameId}`, JSON.stringify(data));
      router.push(`/play/game/${data.gameId}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-black">🎯 إعداد اللعبة</h1>

      <Card className="mb-4">
        <h2 className="mb-3 font-extrabold">نمط اللعب</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SELECTABLE_MODES.map((m) => {
            const info = GAME_MODE_LABELS[m];
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-center transition',
                  mode === m ? 'border-arena-primary bg-arena-primary/15' : 'border-arena-border bg-arena-surface2 hover:border-arena-primary/50'
                )}
              >
                <span className="text-2xl">{info.icon}</span>
                <span className="text-sm font-bold">{info.nameAr}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-white/50">{GAME_MODE_LABELS[mode].descriptionAr}</p>
      </Card>

      <Card className="mb-4">
        <h2 className="mb-3 font-extrabold">التصنيفات</h2>
        {categories.length === 0 ? (
          <Spinner />
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => toggleCategory(c.id)}
                disabled={c.questionCount === 0}
                className={cn(
                  'flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-30',
                  selectedCategoryIds.includes(c.id)
                    ? 'border-arena-primary bg-arena-primary/15'
                    : 'border-arena-border bg-arena-surface2 hover:border-arena-primary/50'
                )}
              >
                <span>{c.icon}</span>
                {c.nameAr}
                <Badge tone="neutral" className="ms-auto">
                  {c.questionCount}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </Card>

      <Card className="mb-4">
        <h2 className="mb-3 font-extrabold">الصعوبة</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setDifficulty('')}
            disabled={mode === 'CHALLENGE'}
            className={cn(
              'rounded-xl border-2 px-4 py-2 text-sm font-bold transition disabled:opacity-30',
              difficulty === '' ? 'border-arena-primary bg-arena-primary/15' : 'border-arena-border bg-arena-surface2'
            )}
          >
            مختلطة
          </button>
          {Object.entries(DIFFICULTY_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setDifficulty(key)}
              disabled={mode === 'CHALLENGE'}
              className={cn(
                'rounded-xl border-2 px-4 py-2 text-sm font-bold transition disabled:opacity-30',
                difficulty === key ? 'border-arena-primary bg-arena-primary/15' : 'border-arena-border bg-arena-surface2'
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {mode === 'CHALLENGE' && <p className="mt-2 text-xs text-arena-accent2">هذا النمط يتكيف تلقائيًا مع مستواك أثناء اللعب 🧠</p>}
      </Card>

      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold">اللعب المحلي (تمرير الجهاز)</h2>
          <button
            onClick={() => setIsLocal((v) => !v)}
            className={cn('h-7 w-12 rounded-full transition', isLocal ? 'bg-arena-primary' : 'bg-white/10')}
          >
            <motion.div className="h-6 w-6 rounded-full bg-white" animate={{ x: isLocal ? -22 : -2 }} />
          </button>
        </div>
        {isLocal && (
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-xs text-white/50">أضف أسماء بقية اللاعبين على نفس الجهاز</p>
            {localPlayers.map((name, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-lg">{AVATAR_EMOJIS[(i + 1) % AVATAR_EMOJIS.length]}</span>
                <Input
                  value={name}
                  onChange={(e) => setLocalPlayers((prev) => prev.map((p, idx) => (idx === i ? e.target.value : p)))}
                  maxLength={30}
                />
                <button onClick={() => setLocalPlayers((prev) => prev.filter((_, idx) => idx !== i))} className="text-white/40 hover:text-arena-danger">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setLocalPlayers((prev) => [...prev, `لاعب ${prev.length + 2}`])}>
              <Plus size={14} /> إضافة لاعب
            </Button>
          </div>
        )}
      </Card>

      {error && <p className="mb-4 rounded-xl bg-arena-danger/20 px-4 py-2 text-sm text-arena-danger">{error}</p>}

      <Button size="xl" className="w-full" disabled={loading} onClick={start}>
        {loading ? <Spinner /> : <Play size={20} />}
        ابدأ اللعبة
      </Button>
    </div>
  );
}
