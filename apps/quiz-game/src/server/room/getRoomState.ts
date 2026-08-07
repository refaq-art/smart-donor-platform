import { prisma } from '@/lib/prisma';
import type { RoomView } from './roomTypes';

export async function getRoomByCode(code: string) {
  return prisma.room.findUnique({
    where: { code: code.toUpperCase() },
    include: { players: { include: { player: true }, orderBy: { joinedAt: 'asc' } }, game: true },
  });
}

export function toRoomView(room: NonNullable<Awaited<ReturnType<typeof getRoomByCode>>>): RoomView {
  return {
    id: room.id,
    code: room.code,
    status: room.status,
    mode: room.mode,
    categoryIds: room.categoryIds as string[],
    difficulty: room.difficulty,
    questionCount: room.questionCount,
    timePerQuestionSeconds: room.timePerQuestionSeconds,
    teamsEnabled: room.teamsEnabled,
    maxPlayers: room.maxPlayers,
    hostPlayerId: room.hostPlayerId,
    gameId: room.game?.id ?? null,
    players: room.players
      .filter((p) => p.status !== 'LEFT')
      .map((p) => ({
        playerId: p.playerId,
        displayName: p.player.displayName,
        avatarEmoji: p.player.avatarEmoji,
        avatarColor: p.player.avatarColor,
        isHost: p.isHost,
        isReady: p.isReady,
        status: p.status,
        teamKey: p.teamKey,
      })),
  };
}
