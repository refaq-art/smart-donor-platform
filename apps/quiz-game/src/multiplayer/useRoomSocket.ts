'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getSocket } from './socketClient';
import type { RoomView } from '@/server/room/roomTypes';
import type { AnswerResult, PlayerResultRow, RoundState } from '@/server/game/types';
import type { ClientToServerEvents, RoomChatMessage, RoomReactionEvent } from './types';

type RoomSettingsPayload = Parameters<ClientToServerEvents['room:settings']>[0];

export interface FloatingReaction extends RoomReactionEvent {
  id: string;
}

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

export function useRoomSocket(code: string, options?: { spectator?: boolean }) {
  const spectator = options?.spectator ?? false;
  const [room, setRoom] = useState<RoomView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [round, setRound] = useState<RoundState | null>(null);
  const [totalRounds, setTotalRounds] = useState(0);
  const [roundComplete, setRoundComplete] = useState<RoundCompleteInfo | null>(null);
  const [finalResults, setFinalResults] = useState<PlayerResultRow[] | null>(null);
  const [liveScores, setLiveScores] = useState<Record<string, LiveScore>>({});
  const [chatMessages, setChatMessages] = useState<RoomChatMessage[]>([]);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [spectatorCount, setSpectatorCount] = useState(0);
  const socketRef = useRef(getSocket());

  useEffect(() => {
    const socket = socketRef.current;
    socket.connect();
    socket.emit(spectator ? 'room:joinSpectator' : 'room:join', { code });

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
    socket.on('room:chat', (msg) => setChatMessages((prev) => [...prev.slice(-49), msg]));
    socket.on('room:spectatorCount', ({ count }) => setSpectatorCount(count));
    socket.on('room:reaction', (r) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setReactions((prev) => [...prev.slice(-19), { id, ...r }]);
      setTimeout(() => setReactions((prev) => prev.filter((x) => x.id !== id)), 2500);
    });

    return () => {
      socket.emit('room:leave');
      socket.off('room:state');
      socket.off('room:error');
      socket.off('game:round');
      socket.off('game:playerAnswered');
      socket.off('game:roundComplete');
      socket.off('game:final');
      socket.off('room:chat');
      socket.off('room:spectatorCount');
      socket.off('room:reaction');
    };
  }, [code, spectator]);

  const setReady = useCallback((ready: boolean) => socketRef.current.emit('room:ready', { ready }), []);
  const selectTeam = useCallback((teamKey: 'A' | 'B') => socketRef.current.emit('room:team', { teamKey }), []);
  const updateSettings = useCallback((settings: RoomSettingsPayload) => {
    socketRef.current.emit('room:settings', settings);
  }, []);
  const startGame = useCallback(() => socketRef.current.emit('room:start'), []);
  const sendChat = useCallback((text: string) => socketRef.current.emit('room:chat', { text }), []);
  const sendReaction = useCallback((emoji: string) => socketRef.current.emit('room:reaction', { emoji }), []);

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

  return {
    room,
    error,
    round,
    totalRounds,
    roundComplete,
    finalResults,
    liveScores,
    chatMessages,
    reactions,
    spectatorCount,
    setReady,
    selectTeam,
    updateSettings,
    startGame,
    submitAnswer,
    sendChat,
    sendReaction,
  };
}
