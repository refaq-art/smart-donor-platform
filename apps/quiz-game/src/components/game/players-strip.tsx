'use client';

import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PlayerStripItem {
  playerId: string;
  displayName: string;
  avatarEmoji: string;
  avatarColor: string;
  score: number;
  hasAnswered: boolean;
  isActiveTurn?: boolean;
  eliminated?: boolean;
}

export function PlayersStrip({ players }: { players: PlayerStripItem[] }) {
  if (players.length <= 1) return null;

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {players.map((p) => (
        <div
          key={p.playerId}
          className={cn(
            'flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-sm font-bold transition',
            p.eliminated
              ? 'border-white/5 bg-white/5 text-white/30 line-through'
              : p.isActiveTurn
                ? 'border-arena-primary bg-arena-primary/20 text-white'
                : 'border-arena-border bg-arena-surface2 text-white/80'
          )}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full text-sm" style={{ backgroundColor: p.avatarColor }}>
            {p.avatarEmoji}
          </span>
          <span>{p.displayName}</span>
          <span className="text-white/50">{p.score.toLocaleString('ar')}</span>
          {!p.eliminated && (p.hasAnswered ? <Check size={14} className="text-arena-success" /> : <Loader2 size={14} className="animate-spin text-white/30" />)}
        </div>
      ))}
    </div>
  );
}
