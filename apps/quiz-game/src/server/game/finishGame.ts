import { prisma } from '@/lib/prisma';
import { evaluateNewAchievements, type AchievementContext } from '@/achievements/evaluator';
import type { PlayerResultRow } from './types';

async function computeCategoryCorrectCounts(playerId: string): Promise<Record<string, number>> {
  const rows = await prisma.score.findMany({
    where: { isCorrect: true, gameSession: { playerId } },
    select: { question: { select: { category: { select: { key: true } } } } },
  });
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const key = row.question.category.key;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export async function finishGame(gameId: string): Promise<PlayerResultRow[]> {
  const game = await prisma.game.findUniqueOrThrow({
    where: { id: gameId },
    include: {
      sessions: { include: { player: true, team: true } },
      teams: true,
    },
  });

  await prisma.game.update({ where: { id: gameId }, data: { status: 'COMPLETED', endedAt: new Date() } });

  let winnerSessionIds = new Set<string>();

  if (game.teamsEnabled && game.teams.length > 0) {
    const teamScores = new Map<string, number>();
    for (const session of game.sessions) {
      if (!session.teamId) continue;
      teamScores.set(session.teamId, (teamScores.get(session.teamId) ?? 0) + session.score);
    }
    const maxTeamScore = Math.max(...Array.from(teamScores.values()), 0);
    const winningTeamIds = new Set(
      Array.from(teamScores.entries())
        .filter(([, score]) => score === maxTeamScore)
        .map(([teamId]) => teamId)
    );
    for (const session of game.sessions) {
      if (session.teamId && winningTeamIds.has(session.teamId)) {
        winnerSessionIds.add(session.id);
      }
    }
    for (const team of game.teams) {
      await prisma.team.update({ where: { id: team.id }, data: { totalScore: teamScores.get(team.id) ?? 0 } });
    }
  } else {
    const maxScore = Math.max(...game.sessions.map((s) => s.score), 0);
    winnerSessionIds = new Set(game.sessions.filter((s) => s.score === maxScore).map((s) => s.id));
  }

  const sorted = [...game.sessions].sort((a, b) => b.score - a.score);
  const resultRows: PlayerResultRow[] = [];

  let rank = 0;
  let lastScore: number | null = null;
  for (let i = 0; i < sorted.length; i++) {
    const session = sorted[i];
    if (lastScore === null || session.score !== lastScore) {
      rank = i + 1;
      lastScore = session.score;
    }
    const isWinner = winnerSessionIds.has(session.id);
    const totalAnswers = session.correctCount + session.wrongCount;

    await prisma.result.create({
      data: {
        gameId,
        playerId: session.playerId,
        teamId: session.teamId,
        rank,
        totalScore: session.score,
        correctAnswers: session.correctCount,
        totalAnswers,
        bestStreak: session.bestStreak,
        isWinner,
      },
    });

    const player = session.player;
    const updatedPlayer = await prisma.player.update({
      where: { id: player.id },
      data: {
        totalScore: { increment: session.score },
        gamesPlayed: { increment: 1 },
        gamesWon: { increment: isWinner ? 1 : 0 },
        correctAnswers: { increment: session.correctCount },
        totalAnswers: { increment: totalAnswers },
        bestStreak: session.bestStreak > player.bestStreak ? session.bestStreak : undefined,
      },
    });

    const correctScores = await prisma.score.findMany({
      where: { gameSessionId: session.id, isCorrect: true },
      select: { answerTimeMs: true },
    });
    const fastestAnswerMsInGame = correctScores.length > 0 ? Math.min(...correctScores.map((s) => s.answerTimeMs)) : null;
    const isFlawlessGame = totalAnswers > 0 && session.wrongCount === 0;
    const categoryCorrectCounts = await computeCategoryCorrectCounts(player.id);

    const existingUnlocked = await prisma.playerAchievement.findMany({
      where: { playerId: player.id },
      select: { achievement: { select: { key: true } } },
    });
    const alreadyUnlockedKeys = new Set(existingUnlocked.map((u) => u.achievement.key));

    const ctx: AchievementContext = {
      gamesWon: updatedPlayer.gamesWon,
      gamesPlayed: updatedPlayer.gamesPlayed,
      bestStreak: updatedPlayer.bestStreak,
      correctAnswers: updatedPlayer.correctAnswers,
      totalAnswers: updatedPlayer.totalAnswers,
      isFlawlessGame,
      fastestAnswerMsInGame,
      categoryCorrectCounts,
    };
    const newKeys = evaluateNewAchievements(ctx, alreadyUnlockedKeys);

    if (newKeys.length > 0) {
      const achievements = await prisma.achievement.findMany({ where: { key: { in: newKeys } } });
      await prisma.playerAchievement.createMany({
        data: achievements.map((a) => ({ playerId: player.id, achievementId: a.id })),
        skipDuplicates: true,
      });
    }

    resultRows.push({
      playerId: player.id,
      displayName: player.displayName,
      avatarEmoji: player.avatarEmoji,
      avatarColor: player.avatarColor,
      teamId: session.teamId,
      teamName: session.team?.name ?? null,
      score: session.score,
      rank,
      correctAnswers: session.correctCount,
      totalAnswers,
      bestStreak: session.bestStreak,
      isWinner,
      newAchievements: newKeys,
    });

    if (game.tournamentId) {
      const existingEntry = await prisma.tournamentParticipant.findUnique({
        where: { tournamentId_playerId: { tournamentId: game.tournamentId, playerId: player.id } },
      });
      const newBestScore = Math.max(existingEntry?.bestScore ?? 0, session.score);
      await prisma.tournamentParticipant.upsert({
        where: { tournamentId_playerId: { tournamentId: game.tournamentId, playerId: player.id } },
        update: { bestScore: newBestScore, gamesPlayed: { increment: 1 } },
        create: { tournamentId: game.tournamentId, playerId: player.id, bestScore: session.score, gamesPlayed: 1 },
      });
    }
  }

  return resultRows.sort((a, b) => a.rank - b.rank);
}
