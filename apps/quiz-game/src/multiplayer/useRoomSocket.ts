'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getSocket } from './socketClient';
import type { RoomView } from '@/server/room/roomTypes';
import type { AnswerResult, PlayerResultRow, RoundState } from '@/server/game/types';
import type { ClientToServerEvents } from './types';

type RoomSettingsPayload = Parameters<ClientToServerEvents['room:settings']>[0];

export interface RoundCompleteInfo {
  correctAnswerIds: string[];
  correctOrderIds: string[] | null;
  correctText: string | null;
  explanationAr: string | null;
}

export interface LiveScore {
  score: number;
  streak: number;
  hasAnswered: boolean;
}

export function useRoomSocket(code: string) {
  const [room, setRoom] = useState<RoomView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [round, setRound] = useState<RoundState | null>(null);
  const [totalRounds, setTotalRounds] = useState(0);
  const [roundComplete, setRoundComplete] = useState<RoundCompleteInfo | null>(null);
  const [finalResults, setFinalResults] = useState<PlayerResultRow[] | null>(null);
  const [liveScores, setLiveScores] = useState<Record<string, LiveScore>>({});
  const socketRef = useRef(getSocket());

  useEffect(() => {
    const socket = socketRef.current;
    socket.connect();
    socket.emit('room:join', { code });

    socket.on('room:state', ({ room }) => setRoom(room));
    socket.on('room:error', ({ message }) => setError(message));
    socket.on('game:round', ({ round, totalRounds }) => {
      setRound(round);
      setTotalRounds(totalRounds);
      setRoundComplete(null);
      setLiveScores((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next)) next[key] = { ...next[key], hasAnswered: false };
        return next;
      });
    });
    socket.on('game:playerAnswered', ({ playerId, score, streak }) => {
      setLiveScores((prev) => ({ ...prev, [playerId]: { score, streak, hasAnswered: true } }));
    });
    socket.on('game:roundComplete', (info) => setRoundComplete(info));
    socket.on('game:final', ({ results }) => setFinalResults(results));

    return () => {
      socket.emit('room:leave');
      socket.off('room:state');
      socket.off('room:error');
      socket.off('game:round');
      socket.off('game:playerAnswered');
      socket.off('game:roundComplete');
      socket.off('game:final');
    };
  }, [code]);

  const setReady = useCallback((ready: boolean) => socketRef.current.emit('room:ready', { ready }), []);
  const selectTeam = useCallback((teamKey: 'A' | 'B') => socketRef.current.emit('room:team', { teamKey }), []);
  const updateSettings = useCallback((settings: RoomSettingsPayload) => {
    socketRef.current.emit('room:settings', settings);
  }, []);
  const startGame = useCallback(() => socketRef.current.emit('room:start'), []);

  const submitAnswer = useCallback(
    (payload: { roundNumber: number; selectedAnswerIds?: string[]; orderedAnswerIds?: string[]; textAnswer?: string }) => {
      return new Promise<AnswerResult>((resolve, reject) => {
        socketRef.current.emit('game:answer', payload, (result) => {
          if ('error' in result) reject(new Error(result.error));
          else resolve(result);
        });
      });
    },
    []
  );

  return { room, error, round, totalRounds, roundComplete, finalResults, liveScores, setReady, selectTeam, updateSettings, startGame, submitAnswer };
}
