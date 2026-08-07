import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

async function getStats() {
  const [questionCount, activeQuestionCount, pendingReviewCount, categoryCount, playerCount, gamesPlayedCount, activeRoomsCount] = await Promise.all([
    prisma.question.count(),
    prisma.question.count({ where: { status: 'ACTIVE' } }),
    prisma.question.count({ where: { status: 'PENDING_REVIEW' } }),
    prisma.category.count(),
    prisma.player.count(),
    prisma.game.count({ where: { status: 'COMPLETED' } }),
    prisma.room.count({ where: { status: { in: ['LOBBY', 'IN_PROGRESS'] } } }),
  ]);
  return { questionCount, activeQuestionCount, pendingReviewCount, categoryCount, playerCount, gamesPlayedCount, activeRoomsCount };
}

export default async function AdminOverviewPage() {
  const stats = await getStats();

  const cards = [
    { label: 'إجمالي الأسئلة', value: stats.questionCount, icon: '❓' },
    { label: 'أسئلة نشطة', value: stats.activeQuestionCount, icon: '✅' },
    { label: 'بانتظار المراجعة', value: stats.pendingReviewCount, icon: '🕵️' },
    { label: 'التصنيفات', value: stats.categoryCount, icon: '🗂️' },
    { label: 'اللاعبون', value: stats.playerCount, icon: '👥' },
    { label: 'مباريات مكتملة', value: stats.gamesPlayedCount, icon: '🏁' },
    { label: 'غرف نشطة الآن', value: stats.activeRoomsCount, icon: '🌐' },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-black">📊 نظرة عامة</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="flex flex-col items-center gap-1 py-6 text-center">
            <span className="text-3xl">{c.icon}</span>
            <span className="text-2xl font-black text-gradient-primary">{c.value.toLocaleString('ar')}</span>
            <span className="text-xs text-white/50">{c.label}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}
