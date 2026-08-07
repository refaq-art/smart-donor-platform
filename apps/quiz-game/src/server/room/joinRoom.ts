import { prisma } from '@/lib/prisma';

export class RoomJoinError extends Error {}

export async function joinRoom(code: string, playerId: string) {
  const room = await prisma.room.findUnique({ where: { code: code.toUpperCase() }, include: { players: true } });
  if (!room) throw new RoomJoinError('لا توجد غرفة بهذا الرمز');
  if (room.status === 'CLOSED' || room.status === 'COMPLETED') throw new RoomJoinError('هذه الغرفة لم تعد متاحة');

  const existing = room.players.find((p) => p.playerId === playerId);
  if (existing) {
    if (existing.status === 'LEFT') {
      await prisma.roomPlayer.update({ where: { id: existing.id }, data: { status: 'CONNECTED', leftAt: null } });
    } else if (existing.status === 'DISCONNECTED') {
      await prisma.roomPlayer.update({ where: { id: existing.id }, data: { status: 'CONNECTED' } });
    }
    return room.id;
  }

  if (room.status !== 'LOBBY') throw new RoomJoinError('بدأت المباراة بالفعل في هذه الغرفة');

  const activeCount = room.players.filter((p) => p.status !== 'LEFT').length;
  if (activeCount >= room.maxPlayers) throw new RoomJoinError('الغرفة ممتلئة');

  await prisma.roomPlayer.create({
    data: {
      roomId: room.id,
      playerId,
      teamKey: room.teamsEnabled ? (activeCount % 2 === 0 ? 'A' : 'B') : null,
    },
  });

  return room.id;
}
