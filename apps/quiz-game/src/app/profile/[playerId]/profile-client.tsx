'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Pencil, Check, X as XIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePlayer } from '@/components/providers/player-provider';
import { GAME_MODE_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface ProfileData {
  player: {
    id: string;
    displayName: string;
    avatarEmoji: string;
    avatarColor: string;
    totalScore: number;
    gamesPlayed: number;
    gamesWon: number;
    accuracy: number;
    bestStreak: number;
    createdAt: string;
  };
  achievements: {
    key: string;
    nameAr: string;
    descriptionAr: string;
    icon: string;
    unlocked: boolean;
    unlockedAt: string | null;
  }[];
  matchHistory: {
    id: string;
    mode: string;
    format: string;
    score: number;
    rank: number;
    isWinner: boolean;
    correctAnswers: number;
    totalAnswers: number;
    bestStreak: number;
    playedAt: string;
  }[];
}

const STAT_ITEMS = (data: ProfileData['player']) => [
  { label: 'إجمالي النقاط', value: data.totalScore.toLocaleString('ar') },
  { label: 'مباريات', value: data.gamesPlayed },
  { label: 'انتصارات', value: data.gamesWon },
  { label: 'نسبة الدقة', value: `${data.accuracy}%` },
  { label: 'أفضل سلسلة', value: data.bestStreak },
];

export function ProfileClient({ playerId }: { playerId: string }) {
  const { player: me, refresh } = usePlayer();
  const [data, setData] = useState<ProfileData | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');

  const isOwn = me?.id === playerId;

  async function load() {
    const res = await fetch(`/api/profile/${playerId}`);
    if (res.ok) {
      const json = await res.json();
      setData(json);
      setName(json.player.displayName);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]);

  async function saveName() {
    await fetch('/api/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: name }),
    });
    setEditing(false);
    await Promise.all([load(), refresh()]);
  }

  if (!data) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const { player } = data;

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full text-4xl" style={{ backgroundColor: player.avatarColor }}>
          {player.avatarEmoji}
        </div>
        {editing ? (
          <div className="flex items-center gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} className="w-48 text-center" maxLength={30} />
            <button onClick={saveName} className="text-arena-success">
              <Check size={20} />
            </button>
            <button onClick={() => setEditing(false)} className="text-arena-danger">
              <XIcon size={20} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black">{player.displayName}</h1>
            {isOwn && (
              <button onClick={() => setEditing(true)} className="text-white/40 hover:text-white">
                <Pencil size={16} />
              </button>
            )}
          </div>
        )}
        <p className="text-xs text-white/40">
          عضو منذ {formatDistanceToNow(new Date(player.createdAt), { locale: ar, addSuffix: true })}
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {STAT_ITEMS(player).map((s) => (
          <Card key={s.label} className="flex flex-col items-center gap-1 py-4 text-center">
            <span className="text-2xl font-black text-gradient-primary">{s.value}</span>
            <span className="text-xs text-white/50">{s.label}</span>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="mb-3 font-extrabold">🏅 الإنجازات</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {data.achievements.map((a) => (
            <div
              key={a.key}
              title={a.descriptionAr}
              className={cn(
                'flex flex-col items-center gap-1 rounded-2xl border p-3 text-center transition',
                a.unlocked ? 'border-arena-accent/40 bg-arena-accent/10' : 'border-white/5 bg-white/5 opacity-40 grayscale'
              )}
            >
              <span className="text-3xl">{a.icon}</span>
              <span className="text-xs font-bold">{a.nameAr}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-extrabold">📜 سجل المباريات</h2>
        {data.matchHistory.length === 0 ? (
          <p className="py-6 text-center text-sm text-white/40">لا توجد مباريات بعد</p>
        ) : (
          <div className="flex flex-col gap-2">
            {data.matchHistory.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge tone={m.isWinner ? 'success' : 'neutral'}>{m.isWinner ? 'فوز 🏆' : `المركز #${m.rank}`}</Badge>
                  <span className="font-bold">{GAME_MODE_LABELS[m.mode]?.nameAr ?? m.mode}</span>
                </div>
                <div className="flex items-center gap-3 text-white/50">
                  <span>{m.correctAnswers}/{m.totalAnswers} صحيحة</span>
                  <span className="font-black text-white">{m.score.toLocaleString('ar')}</span>
                  <span>{formatDistanceToNow(new Date(m.playedAt), { locale: ar, addSuffix: true })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
