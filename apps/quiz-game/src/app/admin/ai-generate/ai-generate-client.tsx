'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label, Select } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { DIFFICULTY_LABELS, QUESTION_TYPE_LABELS } from '@/lib/constants';

interface CategoryOption {
  id: string;
  nameAr: string;
  icon: string;
}

export function AiGenerateClient() {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [type, setType] = useState('MULTIPLE_CHOICE');
  const [count, setCount] = useState(5);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ count: number; note?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => setCategories(data.categories));
  }, []);

  async function generate() {
    setError(null);
    setResult(null);
    if (!categoryId) {
      setError('اختر تصنيفًا');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId, difficulty, type, count, language }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'حدث خطأ');
        return;
      }
      setResult({ count: data.questions.length, note: data.note });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-black">
        <Sparkles className="text-arena-accent2" /> توليد أسئلة بالذكاء الاصطناعي
      </h1>

      <Card className="mb-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>التصنيف</Label>
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">اختر تصنيفًا</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.nameAr}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>الصعوبة</Label>
            <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              {Object.entries(DIFFICULTY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>نوع السؤال</Label>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              {Object.entries(QUESTION_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>اللغة</Label>
            <Select value={language} onChange={(e) => setLanguage(e.target.value as 'ar' | 'en')}>
              <option value="ar">العربية</option>
              <option value="en">الإنجليزية</option>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>عدد الأسئلة: {count}</Label>
            <input type="range" min={1} max={20} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full accent-arena-primary" />
          </div>
        </div>
      </Card>

      {error && <p className="mb-4 rounded-xl bg-arena-danger/20 px-4 py-2 text-sm text-arena-danger">{error}</p>}

      <Button size="lg" className="w-full" disabled={loading} onClick={generate}>
        {loading ? <Spinner /> : '✨ توليد الأسئلة'}
      </Button>

      {result && (
        <Card className="mt-4">
          <p className="font-bold text-arena-success">تم توليد {result.count} سؤال، بانتظار المراجعة.</p>
          {result.note && <p className="mt-2 text-sm text-white/60">{result.note}</p>}
          <Link href="/admin/ai-generate/review" className="mt-3 inline-block">
            <Button variant="outline">الذهاب لمراجعة الأسئلة</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
