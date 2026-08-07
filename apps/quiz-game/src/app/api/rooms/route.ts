export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createRoomSchema } from '@/lib/validation/room';
import { createRoom } from '@/server/room/createRoom';
import { getModeConfig } from '@/game-engine/modes';
import { handleApiError, requireSession } from '@/server/apiHelpers';
import type { GameMode } from '@/game-engine/types';

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = createRoomSchema.parse(await request.json());
    const config = getModeConfig(body.mode as GameMode);

    const room = await createRoom({
      hostPlayerId: session.playerId,
      mode: body.mode as GameMode,
      categoryIds: body.categoryIds,
      difficulty: body.difficulty ?? null,
      questionCount: body.questionCount ?? config.questionCount,
      timePerQuestionSeconds: 20,
      teamsEnabled: body.teamsEnabled ?? config.teamsEnabled,
      maxPlayers: body.maxPlayers ?? 12,
    });

    return NextResponse.json({ code: room.code });
  } catch (error) {
    return handleApiError(error);
  }
}
