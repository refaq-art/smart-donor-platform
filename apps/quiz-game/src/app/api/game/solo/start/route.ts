export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startSoloGameSchema } from '@/lib/validation/game';
import { startGame } from '@/server/game/startGame';
import { handleApiError, requireSession } from '@/server/apiHelpers';
import { AVATAR_COLORS, AVATAR_EMOJIS } from '@/lib/constants';

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = startSoloGameSchema.parse(await request.json());

    const players: { playerId: string; teamKey?: 'A' | 'B' | null; localSlot?: number | null }[] = [];

    if (body.format === 'SOLO') {
      players.push({ playerId: session.playerId, localSlot: 0 });
    } else {
      const hostPlayer = await prisma.player.findUniqueOrThrow({ where: { id: session.playerId } });
      players.push({ playerId: hostPlayer.id, teamKey: body.localPlayers?.[0]?.teamKey ?? null, localSlot: 0 });

      const extras = (body.localPlayers ?? []).slice(1);
      for (let i = 0; i < extras.length; i++) {
        const lp = extras[i];
        const guest = await prisma.player.create({
          data: {
            isGuest: true,
            displayName: lp.displayName,
            avatarEmoji: lp.avatarEmoji ?? AVATAR_EMOJIS[(i + 1) % AVATAR_EMOJIS.length],
            avatarColor: lp.avatarColor ?? AVATAR_COLORS[(i + 1) % AVATAR_COLORS.length],
          },
        });
        players.push({ playerId: guest.id, teamKey: lp.teamKey ?? null, localSlot: i + 1 });
      }
    }

    const result = await startGame({
      mode: body.mode,
      format: body.format,
      categoryIds: body.categoryIds,
      difficulty: body.difficulty ?? null,
      questionCount: body.questionCount,
      players,
    });

    const sessions = await prisma.gameSession.findMany({
      where: { gameId: result.gameId },
      include: { player: true },
      orderBy: { localSlot: 'asc' },
    });

    return NextResponse.json({
      ...result,
      sessions: sessions.map((s) => ({
        sessionId: s.id,
        playerId: s.playerId,
        displayName: s.player.displayName,
        avatarEmoji: s.player.avatarEmoji,
        avatarColor: s.player.avatarColor,
        localSlot: s.localSlot,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
