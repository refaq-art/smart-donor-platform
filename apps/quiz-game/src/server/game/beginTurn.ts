import { prisma } from '@/lib/prisma';

/**
 * يُستخدم في وضع اللعب المحلي (تمرير الجهاز بين اللاعبين): كل لاعب محلي يحصل على
 * مؤقت خاص به يبدأ فعليًا لحظة دوره، بدلًا من مشاركة مؤقت الجولة العالمي — مع بقاء
 * حساب الوقت والنقاط بالكامل من جهة الخادم (لا يُعاد ضبطه إن كانت هناك نتيجة مسجلة مسبقًا).
 */
export async function beginTurn(gameId: string, sessionId: string, roundNumber: number) {
  const round = await prisma.round.findUniqueOrThrow({
    where: { gameId_roundNumber: { gameId, roundNumber } },
  });

  const existingScore = await prisma.score.findFirst({ where: { gameSessionId: sessionId, roundId: round.id } });
  if (existingScore) {
    return { deadlineAt: new Date((round.startedAt ?? new Date()).getTime() + round.timeLimitSeconds * 1000).toISOString() };
  }

  const now = new Date();
  const updated = await prisma.round.update({ where: { id: round.id }, data: { startedAt: now } });

  return { deadlineAt: new Date(now.getTime() + updated.timeLimitSeconds * 1000).toISOString() };
}
