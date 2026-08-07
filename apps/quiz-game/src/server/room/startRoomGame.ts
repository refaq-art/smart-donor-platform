import { prisma } from '@/lib/prisma';
import { startGame } from '@/server/game/startGame';
import { RoomJoinError } from './joinRoom';
import type { GameMode, Difficulty } from '@/game-engine/types';

export async function startRoomGame(roomId: string, requestedByPlayerId: string) {
  const room = await prisma.room.findUniqueOrThrow({
    where: { id: roomId },
    include: { players: { where: { status: { not: 'LEFT' } } } },
  });

  if (room.hostPlayerId !== requestedByPlayerId) throw new RoomJoinError('فقط المضيف يمكنه بدء المباراة');
  if (room.status !== 'LOBBY') throw new RoomJoinError('بدأت المباراة بالفعل');
  if (room.players.length < 2 && room.mode !== 'ONLINE_ROOM') {
    // يسمح ببدء اللعبة حتى بلاعب واحد في وضع اختبار الغرفة، لكن ننصح بلاعبين على الأقل
  }
  if (room.players.length === 0) throw new RoomJoinError('لا يوجد لاعبون في الغرفة');

  const notReady = room.players.filter((p) => !p.isReady && p.playerId !== room.hostPlayerId);
  if (notReady.length > 0) throw new RoomJoinError('بعض اللاعبين ليسوا جاهزين بعد');

  const result = await startGame({
    mode: room.mode as GameMode,
    format: 'ONLINE',
    categoryIds: room.categoryIds as string[],
    difficulty: room.difficulty as Difficulty | null,
    questionCount: room.questionCount,
    roomId: room.id,
    players: room.players.map((p) => ({ playerId: p.playerId, teamKey: p.teamKey })),
  });

  await prisma.room.update({ where: { id: roomId }, data: { status: 'IN_PROGRESS', startedAt: new Date() } });

  return result;
}
