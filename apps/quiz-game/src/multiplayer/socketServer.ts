import type { Server, Socket } from 'socket.io';
import { prisma } from '@/lib/prisma';
import { submitAnswer } from '@/server/game/submitAnswer';
import { joinRoom, RoomJoinError } from '@/server/room/joinRoom';
import { getRoomByCode, toRoomView } from '@/server/room/getRoomState';
import { setReady, selectTeam, markDisconnected, leaveRoom, updateRoomSettings } from '@/server/room/roomActions';
import { startRoomGame } from '@/server/room/startRoomGame';
import { getGameState } from '@/server/game/state';
import { authenticateSocket } from './socketAuth';
import { scheduleRoundTimeout, clearRoundTimeout } from './roundTimers';
import type { ClientToServerEvents, ServerToClientEvents } from './types';
import type { RoundState, PlayerResultRow } from '@/server/game/types';

const REVEAL_DELAY_MS = 4500;
const TIMEOUT_GRACE_MS = 2500;

type AppServer = Server<ClientToServerEvents, ServerToClientEvents>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

interface SocketData {
  playerId: string;
  roomCode?: string;
  roomId?: string;
}

export function initSocketServer(io: AppServer) {
  io.use(async (socket, next) => {
    const session = await authenticateSocket(socket);
    if (!session) {
      next(new Error('unauthorized'));
      return;
    }
    (socket.data as SocketData).playerId = session.playerId;
    next();
  });

  io.on('connection', (socket: AppSocket) => {
    const data = socket.data as SocketData;

    socket.on('room:join', async ({ code }) => {
      try {
        const roomId = await joinRoom(code, data.playerId);
        data.roomCode = code.toUpperCase();
        data.roomId = roomId;
        socket.join(roomCodeChannel(data.roomCode));

        await broadcastRoomState(io, data.roomCode);

        const room = await getRoomByCode(data.roomCode);
        if (room?.status === 'IN_PROGRESS' && room.game) {
          const currentRound = await getCurrentRoundForReconnect(room.game.id);
          if (currentRound) {
            socket.emit('game:round', { round: currentRound, totalRounds: room.game.questionCount });
          }
        }
      } catch (error) {
        socket.emit('room:error', { message: errorMessage(error) });
      }
    });

    socket.on('room:ready', async ({ ready }) => {
      if (!data.roomId || !data.roomCode) return;
      await setReady(data.roomId, data.playerId, ready);
      await broadcastRoomState(io, data.roomCode);
    });

    socket.on('room:team', async ({ teamKey }) => {
      if (!data.roomId || !data.roomCode) return;
      await selectTeam(data.roomId, data.playerId, teamKey);
      await broadcastRoomState(io, data.roomCode);
    });

    socket.on('room:settings', async (settings) => {
      if (!data.roomId || !data.roomCode) return;
      try {
        await updateRoomSettings(data.roomId, data.playerId, settings as any);
        await broadcastRoomState(io, data.roomCode);
      } catch (error) {
        socket.emit('room:error', { message: errorMessage(error) });
      }
    });

    socket.on('room:start', async () => {
      if (!data.roomId || !data.roomCode) return;
      try {
        const result = await startRoomGame(data.roomId, data.playerId);
        await broadcastRoomState(io, data.roomCode);
        io.to(roomCodeChannel(data.roomCode)).emit('game:round', { round: result.firstRound, totalRounds: result.totalRounds });

        scheduleRoundTimeout(result.gameId, 1, timeUntil(result.firstRound.deadlineAt) + TIMEOUT_GRACE_MS, () =>
          forceCompleteRound(io, result.gameId, 1, data.roomCode!)
        );
      } catch (error) {
        socket.emit('room:error', { message: errorMessage(error) });
      }
    });

    socket.on('room:leave', async () => {
      if (data.roomId) {
        await leaveRoom(data.roomId, data.playerId);
        if (data.roomCode) {
          socket.leave(roomCodeChannel(data.roomCode));
          await broadcastRoomState(io, data.roomCode);
        }
      }
      data.roomId = undefined;
      data.roomCode = undefined;
    });

    socket.on('game:answer', async (payload, ack) => {
      try {
        const room = data.roomCode ? await getRoomByCode(data.roomCode) : null;
        if (!room?.game) {
          ack({ error: 'لا توجد مباراة نشطة' });
          return;
        }
        const session = await prisma.gameSession.findFirst({ where: { gameId: room.game.id, playerId: data.playerId } });
        if (!session) {
          ack({ error: 'لست جزءًا من هذه المباراة' });
          return;
        }

        const result = await submitAnswer({
          gameId: room.game.id,
          sessionId: session.id,
          roundNumber: payload.roundNumber,
          selectedAnswerIds: payload.selectedAnswerIds,
          orderedAnswerIds: payload.orderedAnswerIds,
          textAnswer: payload.textAnswer,
        });

        ack(result);

        io.to(roomCodeChannel(data.roomCode!)).emit('game:playerAnswered', {
          playerId: data.playerId,
          score: result.newScore,
          streak: result.newStreak,
        });

        if (result.roundComplete) {
          clearRoundTimeout(room.game.id, payload.roundNumber);
          io.to(roomCodeChannel(data.roomCode!)).emit('game:roundComplete', {
            correctAnswerIds: result.correctAnswerIds,
            correctOrderIds: result.correctOrderIds,
            correctText: result.correctText,
            explanationAr: result.explanationAr,
          });
          scheduleAdvance(io, room.game.id, data.roomCode!, result);
        }
      } catch (error) {
        ack({ error: errorMessage(error) });
      }
    });

    socket.on('disconnect', async () => {
      if (data.roomId && data.roomCode) {
        await markDisconnected(data.roomId, data.playerId);
        await broadcastRoomState(io, data.roomCode);
      }
    });
  });
}

function roomCodeChannel(code: string) {
  return `room:${code}`;
}

function errorMessage(error: unknown) {
  if (error instanceof RoomJoinError) return error.message;
  if (error instanceof Error) return error.message;
  return 'حدث خطأ غير متوقع';
}

function timeUntil(iso: string) {
  return Math.max(0, new Date(iso).getTime() - Date.now());
}

async function broadcastRoomState(io: AppServer, code: string) {
  const room = await getRoomByCode(code);
  if (!room) return;
  io.to(roomCodeChannel(code)).emit('room:state', { room: toRoomView(room) });
}

async function getCurrentRoundForReconnect(gameId: string) {
  const state = await getGameState(gameId);
  return state.currentRound;
}

function scheduleAdvance(
  io: AppServer,
  gameId: string,
  roomCode: string,
  result: { gameFinished: boolean; nextRound: RoundState | null; finalResults: PlayerResultRow[] | null }
) {
  setTimeout(async () => {
    if (result.gameFinished && result.finalResults) {
      io.to(roomCodeChannel(roomCode)).emit('game:final', { results: result.finalResults });
      const game = await prisma.game.findUnique({ where: { id: gameId }, select: { roomId: true } });
      if (game?.roomId) {
        await prisma.room.update({ where: { id: game.roomId }, data: { status: 'COMPLETED', closedAt: new Date() } });
      }
      return;
    }
    if (result.nextRound) {
      io.to(roomCodeChannel(roomCode)).emit('game:round', { round: result.nextRound, totalRounds: result.nextRound.totalRounds });
      scheduleRoundTimeout(gameId, result.nextRound.roundNumber, timeUntil(result.nextRound.deadlineAt) + TIMEOUT_GRACE_MS, () =>
        forceCompleteRound(io, gameId, result.nextRound!.roundNumber, roomCode)
      );
    }
  }, REVEAL_DELAY_MS);
}

async function forceCompleteRound(io: AppServer, gameId: string, roundNumber: number, roomCode: string) {
  const round = await prisma.round.findUnique({ where: { gameId_roundNumber: { gameId, roundNumber } } });
  if (!round) return;

  const activeSessions = await prisma.gameSession.findMany({ where: { gameId, status: 'IN_PROGRESS' } });
  const answered = await prisma.score.findMany({ where: { roundId: round.id }, select: { gameSessionId: true } });
  const answeredIds = new Set(answered.map((a) => a.gameSessionId));
  const missing = activeSessions.filter((s) => !answeredIds.has(s.id));

  let lastResult: Awaited<ReturnType<typeof submitAnswer>> | null = null;
  for (const session of missing) {
    lastResult = await submitAnswer({ gameId, sessionId: session.id, roundNumber });
    io.to(roomCodeChannel(roomCode)).emit('game:playerAnswered', {
      playerId: session.playerId,
      score: lastResult.newScore,
      streak: lastResult.newStreak,
    });
  }

  if (lastResult?.roundComplete) {
    io.to(roomCodeChannel(roomCode)).emit('game:roundComplete', {
      correctAnswerIds: lastResult.correctAnswerIds,
      correctOrderIds: lastResult.correctOrderIds,
      correctText: lastResult.correctText,
      explanationAr: lastResult.explanationAr,
    });
    scheduleAdvance(io, gameId, roomCode, lastResult);
  }
}
