export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ACHIEVEMENT_DEFINITIONS } from '@/lib/constants';
import { accuracyPercent } from '@/lib/utils';
import { jsonError } from '@/server/apiHelpers';

export async function GET(_request: Request, { params }: { params: { playerId: string } }) {
  const player = await prisma.player.findUnique({ where: { id: params.playerId } });
  if (!player) return jsonError('اللاعب غير موجود', 404);

  const unlocked = await prisma.playerAchievement.findMany({
    where: { playerId: player.id },
    include: { achievement: true },
    orderBy: { unlockedAt: 'desc' },
  });
  const unlockedByKey = new Map(unlocked.map((u) => [u.achievement.key, u.unlockedAt]));

  const achievements = ACHIEVEMENT_DEFINITIONS.map((def) => ({
    key: def.key,
    nameAr: def.nameAr,
    descriptionAr: def.descriptionAr,
    icon: def.icon,
    unlocked: unlockedByKey.has(def.key),
    unlockedAt: unlockedByKey.get(def.key) ?? null,
  }));

  const recentResults = await prisma.result.findMany({
    where: { playerId: player.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { game: true },
  });

  return NextResponse.json({
    player: {
      id: player.id,
      displayName: player.displayName,
      avatarEmoji: player.avatarEmoji,
      avatarColor: player.avatarColor,
      totalScore: player.totalScore,
      gamesPlayed: player.gamesPlayed,
      gamesWon: player.gamesWon,
      accuracy: accuracyPercent(player.correctAnswers, player.totalAnswers),
      bestStreak: player.bestStreak,
      createdAt: player.createdAt,
    },
    achievements,
    matchHistory: recentResults.map((r) => ({
      id: r.id,
      gameId: r.gameId,
      mode: r.game.mode,
      format: r.game.format,
      score: r.totalScore,
      rank: r.rank,
      isWinner: r.isWinner,
      correctAnswers: r.correctAnswers,
      totalAnswers: r.totalAnswers,
      bestStreak: r.bestStreak,
      playedAt: r.createdAt,
    })),
  });
}
