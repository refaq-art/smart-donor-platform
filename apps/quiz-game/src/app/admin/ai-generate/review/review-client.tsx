'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, X, Pencil } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { DIFFICULTY_LABELS, QUESTION_TYPE_LABELS } from '@/lib/constants';

interface PendingQuestion {
  id: string;
  textAr: string;
  type: string;
  difficulty: string;
  explanationAr: string | null;
  category: { nameAr: string; icon: string };
  answers: { id: string; textAr: string; isCorrect: boolean }[];
}

export function ReviewClient() {
  const [questions, setQuestions] = useState<PendingQuestion[] | null>(null);

  async function load() {
    const res = await fetch('/api/admin/ai/review');
    const data = await res.json();
    setQuestions(data.questions);
  }

  useEffect(() => {
    load();
  }, []);

  async function act(id: string, action: 'accept' | 'reject') {
    await fetch(`/api/admin/ai/review/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    setQuestions((prev) => prev?.filter((q) => q.id !== id) ?? null);
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-black">🕵️ مراجعة الأسئلة المولّدة</h1>

      {!questions ? (
        <div className="flex justify-center py-10">
          <Spinner className="h-8 w-8" />
        </div>
      ) : questions.length === 0 ? (
        <p className="py-16 text-center text-white/40">لا توجد أسئلة بانتظار المراجعة 🎉</p>
      ) : (
        <div className="flex flex-col gap-3">
          {questions.map((q) => (
            <Card key={q.id}>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge tone="neutral">
                  {q.category.icon} {q.category.nameAr}
                </Badge>
                <Badge tone="neutral">{QUESTION_TYPE_LABELS[q.type]}</Badge>
                <Badge tone="neutral">{DIFFICULTY_LABELS[q.difficulty]}</Badge>
              </div>
              <p className="mb-3 font-bold">{q.textAr}</p>
              <ul className="mb-3 flex flex-col gap-1 text-sm">
                {q.answers.map((a) => (
                  <li key={a.id} className={a.isCorrect ? 'font-bold text-arena-success' : 'text-white/50'}>
                    {a.isCorrect ? '✓' : '•'} {a.textAr}
                  </li>
                ))}
              </ul>
              {q.explanationAr && <p className="mb-3 text-xs text-white/40">💡 {q.explanationAr}</p>}
              <div className="flex gap-2">
                <Button size="sm" variant="success" onClick={() => act(q.id, 'accept')}>
                  <Check size={14} /> قبول
                </Button>
                <Button size="sm" variant="danger" onClick={() => act(q.id, 'reject')}>
                  <X size={14} /> رفض
                </Button>
                <Link href={`/admin/questions/${q.id}/edit`}>
                  <Button size="sm" variant="ghost">
                    <Pencil size={14} /> تعديل
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
