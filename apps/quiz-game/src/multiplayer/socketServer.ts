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
import { ALLOWED_ROOM_REACTIONS } from './types';
import type { ClientToServerEvents, ServerToClientEvents } from './types';
import type { RoundState, PlayerResultRow } from '@/server/game/types';

const REVEAL_DELAY_MS = 4500;
const TIMEOUT_GRACE_MS = 2500;
const CHAT_COOLDOWN_MS = 1200;
const REACTION_COOLDOWN_MS = 400;
const MAX_CHAT_LENGTH = 200;
const ALLOWED_REACTIONS = new Set<string>(ALLOWED_ROOM_REACTIONS);

type AppServer = Server<ClientToServerEvents, ServerToClientEvents>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

interface SocketData {
  playerId: string;
  roomCode?: string;
  roomId?: string;
  isSpectator?: boolean;
  displayName?: string;
  avatarEmoji?: string;
  lastChatAt?: number;
  lastReactionAt?: number;
}

// متفرجو كل غرفة (بمعرّف الاتصال Socket) — عابرون وغير محفوظين في قاعدة البيانات عمدًا،
// لأن المشاهدة لا تُغيّر حالة اللعبة ولا تُحتسب ضمن سعة الغرفة.
const spectatorsByRoom = new Map<string, Set<string>>();

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
        data.isSpectator = false;
        await cacheProfile(data);
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

    socket.on('room:joinSpectator', async ({ code }) => {
      try {
        const upperCode = code.toUpperCase();
        const room = await getRoomByCode(upperCode);
        if (!room) {
          socket.emit('room:error', { message: 'لا توجد غرفة بهذا الرمز' });
          return;
        }
        if (room.status === 'CLOSED') {
          socket.emit('room:error', { message: 'هذه الغرفة لم تعد متاحة' });
          return;
        }

        data.roomCode = upperCode;
        data.roomId = room.id;
        data.isSpectator = true;
        await cacheProfile(data);

        socket.join(roomCodeChannel(upperCode));
        addSpectator(upperCode, socket.id);

        socket.emit('room:state', { room: toRoomView(room) });
        await broadcastSpectatorCount(io, upperCode);

        if (room.status === 'IN_PROGRESS' && room.game) {
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
      const wasSpectator = data.isSpectator;
      const code = data.roomCode;

      if (data.roomId && !wasSpectator) {
        await leaveRoom(data.roomId, data.playerId);
      }
      if (code) {
        socket.leave(roomCodeChannel(code));
        if (wasSpectator) {
          removeSpectator(code, socket.id);
          await broadcastSpectatorCount(io, code);
        } else {
          await broadcastRoomState(io, code);
        }
      }
      data.roomId = undefined;
      data.roomCode = undefined;
      data.isSpectator = false;
    });

    socket.on('room:chat', ({ text }) => {
      if (!data.roomCode) return;
      const trimmed = (text ?? '').trim().slice(0, MAX_CHAT_LENGTH);
      if (!trimmed) return;

      const now = Date.now();
      if (data.lastChatAt && now - data.lastChatAt < CHAT_COOLDOWN_MS) return;
      data.lastChatAt = now;

      io.to(roomCodeChannel(data.roomCode)).emit('room:chat', {
        id: `${socket.id}-${now}`,
        fromPlayerId: data.isSpectator ? null : data.playerId,
        displayName: data.displayName ?? 'لاعب',
        avatarEmoji: data.avatarEmoji ?? '🙂',
        isSpectator: !!data.isSpectator,
        text: trimmed,
        at: new Date(now).toISOString(),
      });
    });

    socket.on('room:reaction', ({ emoji }) => {
      if (!data.roomCode || !ALLOWED_REACTIONS.has(emoji)) return;

      const now = Date.now();
      if (data.lastReactionAt && now - data.lastReactionAt < REACTION_COOLDOWN_MS) return;
      data.lastReactionAt = now;

      io.to(roomCodeChannel(data.roomCode)).emit('room:reaction', {
        displayName: data.displayName ?? 'لاعب',
        avatarEmoji: data.avatarEmoji ?? '🙂',
        emoji,
      });
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
      if (!data.roomCode) return;

      if (data.isSpectator) {
        removeSpectator(data.roomCode, socket.id);
        await broadcastSpectatorCount(io, data.roomCode);
        return;
      }

      if (data.roomId) {
        await markDisconnected(data.roomId, data.playerId);
        await broadcastRoomState(io, data.roomCode);
      }
    });
  });
}

async function cacheProfile(data: SocketData) {
  const profile = await prisma.player.findUnique({ where: { id: data.playerId }, select: { displayName: true, avatarEmoji: true } });
  data.displayName = profile?.displayName ?? (data.isSpectator ? 'مشاهد' : 'لاعب');
  data.avatarEmoji = profile?.avatarEmoji ?? (data.isSpectator ? '👀' : '🙂');
}

function addSpectator(code: string, socketId: string) {
  let set = spectatorsByRoom.get(code);
  if (!set) {
    set = new Set();
    spectatorsByRoom.set(code, set);
  }
  set.add(socketId);
}

function removeSpectator(code: string, socketId: string) {
  const set = spectatorsByRoom.get(code);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) spectatorsByRoom.delete(code);
}

async function broadcastSpectatorCount(io: AppServer, code: string) {
  const count = spectatorsByRoom.get(code)?.size ?? 0;
  io.to(roomCodeChannel(code)).emit('room:spectatorCount', { count });
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
