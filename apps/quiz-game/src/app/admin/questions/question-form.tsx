'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label, Select, Textarea } from '@/components/ui/input';
import { DIFFICULTY_LABELS, QUESTION_TYPE_LABELS } from '@/lib/constants';

interface CategoryOption {
  id: string;
  nameAr: string;
  icon: string;
}

interface AnswerFormItem {
  textAr: string;
  isCorrect: boolean;
  orderIndex: number | null;
}

export interface QuestionFormData {
  categoryId: string;
  type: string;
  difficulty: string;
  textAr: string;
  imageUrl: string;
  explanationAr: string;
  timeLimitSeconds: number;
  basePoints: number;
  status: string;
  answers: AnswerFormItem[];
}

const DEFAULT_FORM: QuestionFormData = {
  categoryId: '',
  type: 'MULTIPLE_CHOICE',
  difficulty: 'MEDIUM',
  textAr: '',
  imageUrl: '',
  explanationAr: '',
  timeLimitSeconds: 20,
  basePoints: 1000,
  status: 'ACTIVE',
  answers: [
    { textAr: '', isCorrect: true, orderIndex: null },
    { textAr: '', isCorrect: false, orderIndex: null },
  ],
};

export function QuestionForm({ questionId, initial }: { questionId?: string; initial?: QuestionFormData }) {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [form, setForm] = useState<QuestionFormData>(initial ?? DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => setCategories(data.categories));
  }, []);

  function updateAnswer(index: number, patch: Partial<AnswerFormItem>) {
    setForm((f) => ({ ...f, answers: f.answers.map((a, i) => (i === index ? { ...a, ...patch } : a)) }));
  }

  function setCorrectSingle(index: number) {
    setForm((f) => ({ ...f, answers: f.answers.map((a, i) => ({ ...a, isCorrect: i === index })) }));
  }

  function addAnswer() {
    setForm((f) => ({ ...f, answers: [...f.answers, { textAr: '', isCorrect: false, orderIndex: null }] }));
  }

  function removeAnswer(index: number) {
    setForm((f) => ({ ...f, answers: f.answers.filter((_, i) => i !== index) }));
  }

  function moveAnswer(index: number, direction: -1 | 1) {
    setForm((f) => {
      const next = [...f.answers];
      const target = index + direction;
      if (target < 0 || target >= next.length) return f;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...f, answers: next };
    });
  }

  function changeType(type: string) {
    let answers: AnswerFormItem[];
    if (type === 'TRUE_FALSE') {
      answers = [
        { textAr: 'صح', isCorrect: true, orderIndex: null },
        { textAr: 'خطأ', isCorrect: false, orderIndex: null },
      ];
    } else if (type === 'WORD_GUESS' || type === 'CHARACTER_GUESS') {
      answers = [{ textAr: '', isCorrect: true, orderIndex: null }];
    } else if (type === 'ORDERING') {
      answers = [
        { textAr: '', isCorrect: true, orderIndex: 0 },
        { textAr: '', isCorrect: true, orderIndex: 1 },
      ];
    } else {
      answers = [
        { textAr: '', isCorrect: true, orderIndex: null },
        { textAr: '', isCorrect: false, orderIndex: null },
      ];
    }
    setForm((f) => ({ ...f, type, answers }));
  }

  async function save() {
    setError(null);
    setSaving(true);
    try {
      const payload = {
        ...form,
        answers: form.answers.map((a, i) => ({
          ...a,
          orderIndex: form.type === 'ORDERING' ? i : null,
        })),
      };
      const res = await fetch(questionId ? `/api/admin/questions/${questionId}` : '/api/admin/questions', {
        method: questionId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'حدث خطأ');
        return;
      }
      router.push('/admin/questions');
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const isTextType = form.type === 'WORD_GUESS' || form.type === 'CHARACTER_GUESS';
  const isOrdering = form.type === 'ORDERING';
  const isTrueFalse = form.type === 'TRUE_FALSE';

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>التصنيف</Label>
            <Select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}>
              <option value="">اختر تصنيفًا</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.nameAr}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>نوع السؤال</Label>
            <Select value={form.type} onChange={(e) => changeType(e.target.value)} disabled={!!questionId}>
              {Object.entries(QUESTION_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>الصعوبة</Label>
            <Select value={form.difficulty} onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}>
              {Object.entries(DIFFICULTY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>الحالة</Label>
            <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="ACTIVE">مفعّل</option>
              <option value="DISABLED">معطّل</option>
            </Select>
          </div>
          <div>
            <Label>مدة السؤال (ثانية)</Label>
            <Input type="number" min={5} max={120} value={form.timeLimitSeconds} onChange={(e) => setForm((f) => ({ ...f, timeLimitSeconds: Number(e.target.value) }))} />
          </div>
          <div>
            <Label>النقاط الأساسية</Label>
            <Input type="number" min={100} max={5000} step={100} value={form.basePoints} onChange={(e) => setForm((f) => ({ ...f, basePoints: Number(e.target.value) }))} />
          </div>
        </div>
      </Card>

      <Card>
        <Label>نص السؤال</Label>
        <Textarea rows={3} value={form.textAr} onChange={(e) => setForm((f) => ({ ...f, textAr: e.target.value }))} placeholder="اكتب نص السؤال هنا..." />

        <div className="mt-4">
          <Label>رابط صورة (اختياري)</Label>
          <Input value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." />
        </div>

        <div className="mt-4">
          <Label>شرح الإجابة الصحيحة (اختياري)</Label>
          <Textarea rows={2} value={form.explanationAr} onChange={(e) => setForm((f) => ({ ...f, explanationAr: e.target.value }))} />
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-extrabold">
            {isTextType ? 'الإجابات المقبولة' : isOrdering ? 'عناصر الترتيب (بالترتيب الصحيح)' : 'خيارات الإجابة'}
          </h3>
          {!isTrueFalse && (
            <Button size="sm" variant="ghost" onClick={addAnswer}>
              <Plus size={14} /> إضافة
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {form.answers.map((a, i) => (
            <div key={i} className="flex items-center gap-2">
              {isOrdering && <span className="w-6 text-center text-white/40">{i + 1}</span>}
              {!isTextType && !isOrdering && (
                <input type="radio" checked={a.isCorrect} onChange={() => setCorrectSingle(i)} className="h-5 w-5 accent-arena-success" />
              )}
              <Input value={a.textAr} onChange={(e) => updateAnswer(i, { textAr: e.target.value })} placeholder={`نص الخيار ${i + 1}`} disabled={isTrueFalse} />
              {isOrdering && (
                <div className="flex flex-col">
                  <button type="button" onClick={() => moveAnswer(i, -1)} className="text-white/40 hover:text-white">
                    <ArrowUp size={14} />
                  </button>
                  <button type="button" onClick={() => moveAnswer(i, 1)} className="text-white/40 hover:text-white">
                    <ArrowDown size={14} />
                  </button>
                </div>
              )}
              {!isTrueFalse && form.answers.length > 1 && (
                <button type="button" onClick={() => removeAnswer(i)} className="text-white/40 hover:text-arena-danger">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {error && <p className="rounded-xl bg-arena-danger/20 px-4 py-2 text-sm text-arena-danger">{error}</p>}

      <Button size="lg" disabled={saving} onClick={save}>
        {saving ? 'جارٍ الحفظ...' : questionId ? 'حفظ التعديلات' : 'إضافة السؤال'}
      </Button>
    </div>
  );
}
