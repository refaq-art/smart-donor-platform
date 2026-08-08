'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { DIFFICULTY_LABELS, GAME_MODE_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { GameMode } from '@/game-engine/types';

interface CategoryOption {
  id: string;
  nameAr: string;
  icon: string;
  questionCount: number;
}

const ROOM_MODES: GameMode[] = ['ONLINE_ROOM', 'CLASSIC', 'QUICK_PLAY', 'TIME_ATTACK', 'ELIMINATION', 'TEAM_BATTLE', 'PARTY'];

export function CreateRoomClient() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [mode, setMode] = useState<GameMode>('ONLINE_ROOM');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => setCategories(data.categories));
  }, []);

  async function create() {
    setError(null);
    if (categoryIds.length === 0) {
      setError('اختر تصنيفًا واحدًا على الأقل');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, categoryIds, difficulty: difficulty || null, maxPlayers, teamsEnabled: mode === 'TEAM_BATTLE' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'حدث خطأ');
        return;
      }
      router.push(`/room/${data.code}/lobby`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-black">
        <Zap className="text-arena-accent2" /> إنشاء غرفة أونلاين
      </h1>

      <Card className="mb-4">
        <h2 className="mb-3 font-extrabold">نمط اللعب</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ROOM_MODES.map((m) => (
            <button
              key={m}
              data-testid={`room-mode-${m}`}
              onClick={() => setMode(m)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-center',
                mode === m ? 'border-arena-primary bg-arena-primary/15' : 'border-arena-border bg-arena-surface2'
              )}
            >
              <span className="text-2xl">{GAME_MODE_LABELS[m].icon}</span>
              <span className="text-sm font-bold">{GAME_MODE_LABELS[m].nameAr}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card className="mb-4">
        <h2 className="mb-3 font-extrabold">التصنيفات</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {categories.map((c) => (
            <button
              key={c.id}
              data-testid="room-category-option"
              onClick={() => setCategoryIds((prev) => (prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id]))}
              disabled={c.questionCount === 0}
              className={cn(
                'flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-bold disabled:opacity-30',
                categoryIds.includes(c.id) ? 'border-arena-primary bg-arena-primary/15' : 'border-arena-border bg-arena-surface2'
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
      </Card>

      <Card className="mb-4">
        <h2 className="mb-3 font-extrabold">الصعوبة</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setDifficulty('')}
            className={cn('rounded-xl border-2 px-4 py-2 text-sm font-bold', difficulty === '' ? 'border-arena-primary bg-arena-primary/15' : 'border-arena-border bg-arena-surface2')}
          >
            مختلطة
          </button>
          {Object.entries(DIFFICULTY_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setDifficulty(key)}
              className={cn('rounded-xl border-2 px-4 py-2 text-sm font-bold', difficulty === key ? 'border-arena-primary bg-arena-primary/15' : 'border-arena-border bg-arena-surface2')}
            >
              {label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="mb-6">
        <h2 className="mb-3 flex items-center gap-2 font-extrabold">
          <Users size={18} /> الحد الأقصى للاعبين: {maxPlayers}
        </h2>
        <input
          type="range"
          min={2}
          max={20}
          value={maxPlayers}
          onChange={(e) => setMaxPlayers(Number(e.target.value))}
          className="w-full accent-arena-primary"
        />
      </Card>

      {error && <p className="mb-4 rounded-xl bg-arena-danger/20 px-4 py-2 text-sm text-arena-danger">{error}</p>}

      <Button size="xl" className="w-full" data-testid="create-room-button" disabled={loading} onClick={create}>
        {loading ? <Spinner /> : '🚀 إنشاء الغرفة'}
      </Button>
    </div>
  );
}
