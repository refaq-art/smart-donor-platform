import { prisma } from '@/lib/prisma';
import { RoomJoinError } from './joinRoom';

export async function setReady(roomId: string, playerId: string, isReady: boolean) {
  await prisma.roomPlayer.updateMany({ where: { roomId, playerId }, data: { isReady } });
}

export async function selectTeam(roomId: string, playerId: string, teamKey: 'A' | 'B') {
  await prisma.roomPlayer.updateMany({ where: { roomId, playerId }, data: { teamKey } });
}

export async function markDisconnected(roomId: string, playerId: string) {
  await prisma.roomPlayer.updateMany({ where: { roomId, playerId }, data: { status: 'DISCONNECTED' } });
}

export async function leaveRoom(roomId: string, playerId: string) {
  await prisma.roomPlayer.updateMany({ where: { roomId, playerId }, data: { status: 'LEFT', leftAt: new Date() } });
}

export async function updateRoomSettings(
  roomId: string,
  hostPlayerId: string,
  settings: Partial<{
    mode: string;
    categoryIds: string[];
    difficulty: string | null;
    questionCount: number;
    teamsEnabled: boolean;
    maxPlayers: number;
  }>
) {
  const room = await prisma.room.findUniqueOrThrow({ where: { id: roomId } });
  if (room.hostPlayerId !== hostPlayerId) throw new RoomJoinError('فقط المضيف يمكنه تعديل الإعدادات');
  if (room.status !== 'LOBBY') throw new RoomJoinError('لا يمكن تعديل الإعدادات بعد بدء اللعبة');

  await prisma.room.update({
    where: { id: roomId },
    data: settings as any,
  });
}
