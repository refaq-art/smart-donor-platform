import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { QuestionForm } from '../../question-form';

export const dynamic = 'force-dynamic';

export default async function EditQuestionPage({ params }: { params: { id: string } }) {
  const question = await prisma.question.findUnique({
    where: { id: params.id },
    include: { answers: { orderBy: { orderIndex: 'asc' } } },
  });
  if (!question) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-black">✏️ تعديل السؤال</h1>
      <QuestionForm
        questionId={question.id}
        initial={{
          categoryId: question.categoryId,
          type: question.type,
          difficulty: question.difficulty,
          textAr: question.textAr,
          imageUrl: question.imageUrl ?? '',
          explanationAr: question.explanationAr ?? '',
          timeLimitSeconds: question.timeLimitSeconds,
          basePoints: question.basePoints,
          status: question.status === 'PENDING_REVIEW' ? 'ACTIVE' : (question.status as 'ACTIVE' | 'DISABLED'),
          answers: question.answers.map((a) => ({ textAr: a.textAr, isCorrect: a.isCorrect, orderIndex: a.orderIndex })),
        }}
      />
    </div>
  );
}
