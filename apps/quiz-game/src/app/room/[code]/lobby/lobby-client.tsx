'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Copy, Crown, Check, Loader2, Users, Minus, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePlayer } from '@/components/providers/player-provider';
import { useRoomSocket } from '@/multiplayer/useRoomSocket';
import { DIFFICULTY_LABELS, GAME_MODE_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function LobbyClient({ code }: { code: string }) {
  const router = useRouter();
  const { player } = usePlayer();
  const { room, error, round, setReady, selectTeam, updateSettings, startGame } = useRoomSocket(code);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (round) {
      router.push(`/room/${code}/play`);
    }
  }, [round, code, router]);

  function copyCode() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  if (error) {
    return <p className="py-20 text-center text-arena-danger">{error}</p>;
  }
  if (!room) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-arena-primary2" />
      </div>
    );
  }

  const me = room.players.find((p) => p.playerId === player?.id);
  const isHost = me?.isHost ?? false;
  const nonHostNotReady = room.players.filter((p) => !p.isHost && !p.isReady);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <p className="text-sm text-white/50">رمز الغرفة</p>
        <button onClick={copyCode} className="flex items-center gap-3 rounded-2xl bg-white/5 px-6 py-3">
          <span className="text-3xl font-black tracking-[0.3em] text-gradient-primary">{room.code}</span>
          {copied ? <Check className="text-arena-success" /> : <Copy className="text-white/50" />}
        </button>
        <p className="text-xs text-white/40">شارك الرمز مع أصدقائك ليدخلوا من "انضم لغرفة"</p>
      </div>

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge tone="primary">
            {GAME_MODE_LABELS[room.mode]?.icon} {GAME_MODE_LABELS[room.mode]?.nameAr}
          </Badge>
          <Badge tone="neutral">{room.difficulty ? DIFFICULTY_LABELS[room.difficulty] : 'صعوبة مختلطة'}</Badge>
          {isHost ? (
            <div className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-1">
              <button onClick={() => updateSettings({ questionCount: Math.max(3, room.questionCount - 1) })}>
                <Minus size={14} />
              </button>
              <span className="text-xs font-bold">{room.questionCount} سؤال</span>
              <button onClick={() => updateSettings({ questionCount: Math.min(50, room.questionCount + 1) })}>
                <Plus size={14} />
              </button>
            </div>
          ) : (
            <Badge tone="neutral">{room.questionCount} سؤال</Badge>
          )}
        </div>
      </Card>

      <Card className="mb-4">
        <h2 className="mb-3 flex items-center gap-2 font-extrabold">
          <Users size={18} /> اللاعبون ({room.players.length}/{room.maxPlayers})
        </h2>
        <div className="flex flex-col gap-2">
          {room.players.map((p) => (
            <motion.div
              key={p.playerId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn('flex items-center gap-3 rounded-xl px-3 py-2', p.status === 'DISCONNECTED' ? 'bg-white/5 opacity-40' : 'bg-white/5')}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full text-lg" style={{ backgroundColor: p.avatarColor }}>
                {p.avatarEmoji}
              </span>
              <span className="flex-1 font-bold">
                {p.displayName} {p.isHost && <Crown size={14} className="inline text-arena-gold" />}
              </span>
              {room.teamsEnabled && p.teamKey && (
                <Badge tone={p.teamKey === 'A' ? 'danger' : 'primary'}>{p.teamKey === 'A' ? 'الأحمر' : 'الأزرق'}</Badge>
              )}
              {p.isReady ? <Badge tone="success">جاهز</Badge> : <Badge tone="neutral">ينتظر</Badge>}
            </motion.div>
          ))}
        </div>
      </Card>

      {room.teamsEnabled && (
        <Card className="mb-4">
          <h2 className="mb-3 font-extrabold">اختر فريقك</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button variant={me?.teamKey === 'A' ? 'danger' : 'ghost'} onClick={() => selectTeam('A')}>
              الفريق الأحمر
            </Button>
            <Button variant={me?.teamKey === 'B' ? 'primary' : 'ghost'} onClick={() => selectTeam('B')}>
              الفريق الأزرق
            </Button>
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" className="flex-1" variant={me?.isReady ? 'success' : 'outline'} onClick={() => setReady(!me?.isReady)}>
          {me?.isReady ? '✓ جاهز' : 'استعد'}
        </Button>
        {isHost && (
          <Button size="lg" className="flex-1" disabled={nonHostNotReady.length > 0 || room.players.length < 1} onClick={startGame}>
            🚀 ابدأ المباراة {nonHostNotReady.length > 0 && `(بانتظار ${nonHostNotReady.length})`}
          </Button>
        )}
      </div>
    </div>
  );
}
