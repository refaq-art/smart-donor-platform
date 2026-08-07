import type { RoundState, AnswerResult, PlayerResultRow } from '@/server/game/types';
import type { RoomView } from '@/server/room/roomTypes';

export interface ServerToClientEvents {
  'room:state': (payload: { room: RoomView }) => void;
  'room:error': (payload: { message: string }) => void;
  'game:round': (payload: { round: RoundState; totalRounds: number }) => void;
  'game:playerAnswered': (payload: { playerId: string; score: number; streak: number }) => void;
  'game:roundComplete': (payload: {
    correctAnswerIds: string[];
    correctOrderIds: string[] | null;
    correctText: string | null;
    explanationAr: string | null;
  }) => void;
  'game:final': (payload: { results: PlayerResultRow[] }) => void;
}

export interface ClientToServerEvents {
  'room:join': (payload: { code: string }) => void;
  'room:ready': (payload: { ready: boolean }) => void;
  'room:team': (payload: { teamKey: 'A' | 'B' }) => void;
  'room:settings': (payload: Partial<{ categoryIds: string[]; difficulty: string | null; questionCount: number; mode: string; teamsEnabled: boolean; maxPlayers: number }>) => void;
  'room:start': () => void;
  'room:leave': () => void;
  'game:answer': (
    payload: { roundNumber: number; selectedAnswerIds?: string[]; orderedAnswerIds?: string[]; textAnswer?: string },
    ack: (result: AnswerResult | { error: string }) => void
  ) => void;
}
