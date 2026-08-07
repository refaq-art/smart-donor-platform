'use client';

import { useEffect, useState } from 'react';
import { GamePlayer, type GamePlayerSession } from '@/components/game/game-player';
import { Spinner } from '@/components/ui/spinner';
import type { RoundState } from '@/server/game/types';

interface StartPayload {
  gameId: string;
  totalRounds: number;
  firstRound: RoundState;
  sessions: GamePlayerSession[];
}

export function GamePageClient({ gameId }: { gameId: string }) {
  const [data, setData] = useState<StartPayload | null>(null);
  const [format, setFormat] = useState<'SOLO' | 'LOCAL'>('SOLO');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = sessionStorage.getItem(`quiz_game_${gameId}`);
    if (cached) {
      const parsed = JSON.parse(cached) as StartPayload;
      setData(parsed);
      setFormat(parsed.sessions.length > 1 ? 'LOCAL' : 'SOLO');
      return;
    }

    fetch(`/api/game/solo/${gameId}/state`)
      .then((r) => r.json())
      .then((state) => {
        if (!state.currentRound) {
          setError('انتهت هذه المباراة بالفعل');
          return;
        }
        setFormat(state.format === 'LOCAL' ? 'LOCAL' : 'SOLO');
        setData({
          gameId: state.gameId,
          totalRounds: state.totalRounds,
          firstRound: state.currentRound,
          sessions: state.sessions.map((s: any) => ({
            sessionId: s.sessionId,
            playerId: s.playerId,
            displayName: s.displayName,
            avatarEmoji: s.avatarEmoji,
            avatarColor: s.avatarColor,
            localSlot: s.localSlot ?? 0,
          })),
        });
      });
  }, [gameId]);

  if (error) {
    return <p className="py-20 text-center text-white/60">{error}</p>;
  }

  if (!data) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <GamePlayer
      gameId={data.gameId}
      format={format}
      initialRound={data.firstRound}
      totalRounds={data.totalRounds}
      sessions={data.sessions}
    />
  );
}
