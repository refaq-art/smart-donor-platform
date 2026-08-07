export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { startOfDay, startOfWeek } from 'date-fns';
import { prisma } from '@/lib/prisma';

type Range = 'today' | 'week' | 'all';
type SortBy = 'score' | 'wins' | 'streak';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = (searchParams.get('range') as Range) ?? 'all';
  const sortBy = (searchParams.get('sortBy') as SortBy) ?? 'score';

  if (range === 'all') {
    const orderBy =
      sortBy === 'wins' ? { gamesWon: 'desc' as const } : sortBy === 'streak' ? { bestStreak: 'desc' as const } : { totalScore: 'desc' as const };

    const players = await prisma.player.findMany({
      where: { gamesPlayed: { gt: 0 } },
      orderBy,
      take: 50,
    });

    return NextResponse.json({
      range,
      sortBy,
      entries: players.map((p, i) => ({
        rank: i + 1,
        playerId: p.id,
        displayName: p.displayName,
        avatarEmoji: p.avatarEmoji,
        avatarColor: p.avatarColor,
        value: sortBy === 'wins' ? p.gamesWon : sortBy === 'streak' ? p.bestStreak : p.totalScore,
        gamesPlayed: p.gamesPlayed,
        gamesWon: p.gamesWon,
        bestStreak: p.bestStreak,
      })),
    });
  }

  const since = range === 'today' ? startOfDay(new Date()) : startOfWeek(new Date(), { weekStartsOn: 6 });

  const grouped = await prisma.result.groupBy({
    by: ['playerId'],
    where: { createdAt: { gte: since } },
    _sum: { totalScore: true },
    _max: { bestStreak: true },
    _count: { _all: true },
    orderBy: { _sum: { totalScore: 'desc' } },
    take: 50,
  });

  const playerIds = grouped.map((g) => g.playerId);
  const players = await prisma.player.findMany({ where: { id: { in: playerIds } } });
  const playerById = new Map(players.map((p) => [p.id, p]));

  return NextResponse.json({
    range,
    sortBy: 'score',
    entries: grouped
      .map((g, i) => {
        const player = playerById.get(g.playerId);
        if (!player) return null;
        return {
          rank: i + 1,
          playerId: player.id,
          displayName: player.displayName,
          avatarEmoji: player.avatarEmoji,
          avatarColor: player.avatarColor,
          value: g._sum.totalScore ?? 0,
          gamesPlayed: g._count._all,
          gamesWon: 0,
          bestStreak: g._max.bestStreak ?? 0,
        };
      })
      .filter(Boolean),
  });
}
