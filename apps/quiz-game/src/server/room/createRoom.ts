import { prisma } from '@/lib/prisma';
import { generateRoomCode } from '@/lib/utils';
import type { Difficulty, GameMode } from '@/game-engine/types';

export interface CreateRoomParams {
  hostPlayerId: string;
  mode: GameMode;
  categoryIds: string[];
  difficulty?: Difficulty | null;
  questionCount: number;
  timePerQuestionSeconds: number;
  teamsEnabled: boolean;
  maxPlayers: number;
}

export async function createRoom(params: CreateRoomParams) {
  let code = generateRoomCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await prisma.room.findUnique({ where: { code } });
    if (!existing) break;
    code = generateRoomCode();
  }

  const room = await prisma.room.create({
    data: {
      code,
      hostPlayerId: params.hostPlayerId,
      mode: params.mode,
      categoryIds: params.categoryIds,
      difficulty: params.difficulty ?? null,
      questionCount: params.questionCount,
      timePerQuestionSeconds: params.timePerQuestionSeconds,
      teamsEnabled: params.teamsEnabled,
      maxPlayers: params.maxPlayers,
      players: {
        create: {
          playerId: params.hostPlayerId,
          isHost: true,
          isReady: false,
          teamKey: params.teamsEnabled ? 'A' : null,
        },
      },
    },
    include: { players: { include: { player: true } } },
  });

  return room;
}
